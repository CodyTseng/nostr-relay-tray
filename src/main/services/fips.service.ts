import { ipcMain } from 'electron'
import { EventEmitter } from 'node:stream'
import { nip19 } from 'nostr-tools'
import { CONFIG_KEY } from '../../common/config'
import { FIPS_ACCESS_MODE, RELAY_PORT, TFipsAccessMode } from '../../common/constants'
import { TFipsFirewallStatus, TFipsState } from '../../common/types'
import { normalizeIpv6, npubToMeshAddress } from '../fips/address'
import { showStatus, TFipsNodeStatus } from '../fips/control-client'
import { getFirewallStatus } from '../fips/firewall-status'
import { ConfigRepository } from '../repositories/config.repository'
import { TSendToRenderer } from '../types'
import { RelayService } from './relay.service'

const POLL_INTERVAL = 10_000

/**
 * Exposes the relay on the local fips mesh.
 *
 * Reachability has two parts, both handled in-process so the feature works on
 * any machine running a fips node -- no firewall tooling or privileges:
 *
 *   1. a listener bound to this node's mesh address (fips0 is IPv6-only, so the
 *      default 0.0.0.0 listener does not cover it), and
 *   2. an access guard on that listener.
 *
 * Whitelisting by source address is sound because a mesh address is
 * `0xfd || sha256(pubkey)[0..15]` and the daemon only delivers packets from a
 * peer after its Noise session authenticates that key -- the source address is
 * the authenticated identity.
 */
export class FipsService extends EventEmitter {
  private nodeStatus: TFipsNodeStatus | null = null
  private firewall: TFipsFirewallStatus = { kind: 'unknown' }
  private enabled = false
  private accessMode: TFipsAccessMode = FIPS_ACCESS_MODE.OPEN
  /** Hex pubkeys; encoded to npub only for display. */
  private allowedPubkeys: string[] = []
  private pollTimer: NodeJS.Timeout | null = null
  private lastPushedState = ''

  constructor(
    private readonly relay: RelayService,
    private readonly configRepository: ConfigRepository,
    private readonly sendToRenderer: TSendToRenderer
  ) {
    super()
  }

  async init() {
    const config = await this.configRepository.getMany([
      CONFIG_KEY.FIPS_ENABLED,
      CONFIG_KEY.FIPS_ACCESS_MODE,
      CONFIG_KEY.FIPS_ALLOWED_PUBKEYS
    ])
    this.enabled = config.get(CONFIG_KEY.FIPS_ENABLED) === 'true'
    this.accessMode =
      config.get(CONFIG_KEY.FIPS_ACCESS_MODE) === FIPS_ACCESS_MODE.WHITELIST
        ? FIPS_ACCESS_MODE.WHITELIST
        : FIPS_ACCESS_MODE.OPEN
    this.allowedPubkeys = parsePubkeys(config.get(CONFIG_KEY.FIPS_ALLOWED_PUBKEYS))

    ipcMain.handle('fips:getState', () => this.getState())
    ipcMain.handle('fips:setEnabled', (_, enabled: boolean) => this.setEnabled(enabled))
    ipcMain.handle('fips:setAccessMode', (_, mode: TFipsAccessMode) => this.setAccessMode(mode))
    ipcMain.handle('fips:addAllowedNpub', (_, npub: string) => this.addAllowedNpub(npub))
    ipcMain.handle('fips:removeAllowedNpub', (_, npub: string) => this.removeAllowedNpub(npub))

    await this.refreshNodeStatus()
    if (this.enabled) {
      // Don't let a firewall or bind failure stop the app from starting.
      try {
        await this.apply()
      } catch (error) {
        this.sendToRenderer('app:log', {
          timestamp: Date.now(),
          message: `Failed to enable fips: ${(error as Error).message}`
        })
      }
    }

    this.pollTimer = setInterval(() => this.poll(), POLL_INTERVAL)
    this.pushState()
  }

  getState(): TFipsState {
    return {
      daemonReachable: !!this.nodeStatus,
      tunName: this.nodeStatus?.tunName ?? null,
      tunActive: this.nodeStatus?.tunActive ?? false,
      meshAddress: this.nodeStatus?.meshAddress ?? null,
      npub: this.nodeStatus?.npub ?? null,
      peerCount: this.nodeStatus?.peerCount ?? 0,
      enabled: this.enabled,
      accessMode: this.accessMode,
      allowedNpubs: this.allowedPubkeys.map((pubkey) => nip19.npubEncode(pubkey)),
      bound: this.relay.isMeshHostBound(),
      firewall: this.firewall
    }
  }

  private async setEnabled(enabled: boolean) {
    if (this.enabled === enabled) return

    this.enabled = enabled
    await this.configRepository.set(CONFIG_KEY.FIPS_ENABLED, `${enabled}`)
    await this.apply()
  }

  private async setAccessMode(mode: TFipsAccessMode) {
    if (this.accessMode === mode) return

    this.accessMode = mode
    await this.configRepository.set(CONFIG_KEY.FIPS_ACCESS_MODE, mode)
    await this.apply()
  }

  private async addAllowedNpub(npub: string) {
    const pubkey = decodeNpub(npub)
    if (this.allowedPubkeys.includes(pubkey)) return

    this.allowedPubkeys = [...this.allowedPubkeys, pubkey]
    await this.persistAllowedPubkeys()
    await this.apply()
  }

  private async removeAllowedNpub(npub: string) {
    const pubkey = decodeNpub(npub)
    if (!this.allowedPubkeys.includes(pubkey)) return

    this.allowedPubkeys = this.allowedPubkeys.filter((key) => key !== pubkey)
    await this.persistAllowedPubkeys()
    await this.apply()
  }

  private async persistAllowedPubkeys() {
    await this.configRepository.set(
      CONFIG_KEY.FIPS_ALLOWED_PUBKEYS,
      JSON.stringify(this.allowedPubkeys)
    )
  }

  /**
   * Bring the listener and its access guard in line with the current config.
   * Always safe to call again -- it reconciles rather than toggles.
   */
  private async apply() {
    try {
      if (!this.enabled || !this.nodeStatus?.meshAddress) {
        await this.relay.unbindMeshHost()
        return
      }

      await this.relay.bindMeshHost(this.nodeStatus.meshAddress)
      this.relay.setMeshAccessGuard(this.buildAccessGuard())
    } finally {
      this.pushState()
    }
  }

  /**
   * Null opens the listener to the whole mesh. Otherwise only the derived
   * addresses of the allowed npubs get through -- including an empty set, which
   * correctly lets nobody in.
   */
  private buildAccessGuard() {
    if (this.accessMode === FIPS_ACCESS_MODE.OPEN) {
      return null
    }

    const allowed = new Set(
      this.allowedPubkeys.map((pubkey) => npubToMeshAddress(nip19.npubEncode(pubkey)))
    )
    return (remoteAddress: string) => {
      const normalized = normalizeIpv6(remoteAddress)
      return !!normalized && allowed.has(normalized)
    }
  }

  private async poll() {
    const previousAddress = this.nodeStatus?.meshAddress ?? null
    await this.refreshNodeStatus()
    const currentAddress = this.nodeStatus?.meshAddress ?? null

    if (this.enabled && previousAddress !== currentAddress) {
      // Daemon restarted, went away, or came back under a new identity.
      try {
        await this.apply()
      } catch {
        // Surfaced through state; the next poll retries.
      }
    }
    this.pushState()
  }

  private async refreshNodeStatus() {
    this.nodeStatus = await showStatus()
    this.firewall = getFirewallStatus(RELAY_PORT)
  }

  private pushState() {
    const state = this.getState()
    const serialized = JSON.stringify(state)
    if (serialized === this.lastPushedState) return

    this.lastPushedState = serialized
    this.sendToRenderer('fips:stateChange', state)
    this.emit('status', state)
  }

  destroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }
}

function decodeNpub(npub: string): string {
  const decoded = nip19.decode(npub)
  if (decoded.type !== 'npub') {
    throw new Error(`Expected an npub, got ${decoded.type}`)
  }
  return decoded.data as string
}

function parsePubkeys(raw: string | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((key) => typeof key === 'string') : []
  } catch {
    return []
  }
}
