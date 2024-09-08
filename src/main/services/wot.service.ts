import { WotGuard } from '@nostr-relay/wot-guard'
import dayjs from 'dayjs'
import { CONFIG_KEY } from '../../common/config'
import { ConfigRepository } from '../repositories/config.repository'
import { getAgent } from '../utils'
import { ipcMain } from 'electron'
import { EventRepositorySqlite } from '@nostr-relay/event-repository-sqlite'
import { nip19 } from 'nostr-tools'

export class WotService {
  private readonly wotGuard: WotGuard
  private enabled: boolean = false
  private trustAnchor: string | undefined
  private trustDepth: number = 1
  private refreshInterval: number = 1
  private isRefreshing: boolean = false

  constructor(
    private readonly configRepository: ConfigRepository,
    eventRepository: EventRepositorySqlite
  ) {
    this.wotGuard = new WotGuard({
      enabled: false,
      trustAnchorPubkey: '',
      trustDepth: 0,
      eventRepository,
      relayUrls: ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nos.lol']
    })
  }

  async init() {
    const config = await this.configRepository.getMany([
      CONFIG_KEY.WOT_ENABLED,
      CONFIG_KEY.WOT_TRUST_ANCHOR,
      CONFIG_KEY.WOT_TRUST_DEPTH,
      CONFIG_KEY.WOT_REFRESH_INTERVAL
    ])

    this.enabled = config.get(CONFIG_KEY.WOT_ENABLED) === 'true'
    this.trustDepth = parseInt(config.get(CONFIG_KEY.WOT_TRUST_DEPTH) ?? '1')
    this.refreshInterval = parseInt(config.get(CONFIG_KEY.WOT_REFRESH_INTERVAL) ?? '1')
    this.trustAnchor = config.get(CONFIG_KEY.WOT_TRUST_ANCHOR)

    ipcMain.handle('wot:getEnabled', () => this.enabled)
    ipcMain.handle('wot:setEnabled', async (_, enabled: boolean) => {
      await this.setEnabled(enabled)
    })
    ipcMain.handle('wot:getTrustAnchor', () =>
      this.trustAnchor ? this.encodeHexPubkey(this.trustAnchor) : this.trustAnchor
    )
    ipcMain.handle('wot:setTrustAnchor', async (_, trustAnchor: string) => {
      await this.setTrustAnchor(trustAnchor)
    })
    ipcMain.handle('wot:getTrustDepth', () => this.trustDepth)
    ipcMain.handle('wot:setTrustDepth', async (_, trustDepth: number) => {
      await this.setTrustDepth(trustDepth)
    })
    ipcMain.handle('wot:getRefreshInterval', () => this.refreshInterval)
    ipcMain.handle('wot:setRefreshInterval', async (_, refreshInterval: number) => {
      await this.setRefreshInterval(refreshInterval)
    })
    ipcMain.handle('wot:refreshTrustedPubkeySet', async () => {
      await this.refreshTrustedPubkeySet()
    })
    ipcMain.handle('wot:getLastRefreshedAt', () => this.wotGuard.getLastRefreshedAt())
    ipcMain.handle('wot:getTrustedPubkeyCount', () => this.wotGuard.getTrustedPubkeyCount())
    ipcMain.handle('wot:checkNpub', async (_, npub: string) => {
      const pubkey = this.decodeNpub(npub)
      return this.wotGuard.checkPubkey(pubkey)
    })

    if (!this.enabled || !this.trustAnchor) {
      return
    }

    this.wotGuard.setTrustAnchorPubkey(this.trustAnchor)
    this.wotGuard.setTrustDepth(this.trustDepth)
    this.wotGuard.setRefreshInterval(
      dayjs.duration({ hours: this.refreshInterval }).asMilliseconds()
    )
    this.wotGuard.setEnabled(this.enabled)

    const agent = await getAgent('wss://relay.damus.io')
    if (agent) {
      this.wotGuard.setAgent(agent)
    }

    await this.wotGuard.refreshTrustedPubkeySet()
  }

  getWotGuard() {
    return this.wotGuard
  }

  private async setEnabled(enabled: boolean) {
    if (this.enabled === enabled) {
      return
    }
    this.enabled = enabled
    this.wotGuard.setEnabled(enabled)
    await this.configRepository.set(CONFIG_KEY.WOT_ENABLED, enabled.toString())
    if (enabled) {
      await this.refreshTrustedPubkeySet()
    }
  }

  private async setTrustAnchor(npub: string) {
    this.trustAnchor = npub.length ? this.decodeNpub(npub) : ''
    this.wotGuard.setTrustAnchorPubkey(this.trustAnchor)
    await this.configRepository.set(CONFIG_KEY.WOT_TRUST_ANCHOR, this.trustAnchor)
  }

  private async setTrustDepth(trustDepth: number) {
    this.trustDepth = trustDepth
    this.wotGuard.setTrustDepth(trustDepth)
    await this.configRepository.set(CONFIG_KEY.WOT_TRUST_DEPTH, trustDepth.toString())
  }

  private async setRefreshInterval(refreshInterval: number) {
    this.refreshInterval = refreshInterval
    this.wotGuard.setRefreshInterval(dayjs.duration({ hours: refreshInterval }).asMilliseconds())
    await this.configRepository.set(CONFIG_KEY.WOT_REFRESH_INTERVAL, refreshInterval.toString())
  }

  private async refreshTrustedPubkeySet() {
    if (this.isRefreshing) {
      return
    }
    this.isRefreshing = true
    const timeout = setTimeout(
      () => {
        this.isRefreshing = false
      },
      dayjs.duration({ minutes: 5 }).asMilliseconds()
    )

    await this.wotGuard.refreshTrustedPubkeySet()

    this.isRefreshing = false
    clearTimeout(timeout)
  }

  private decodeNpub(npub: string) {
    return nip19.decode(npub).data as string
  }

  private encodeHexPubkey(pubkey: string) {
    return nip19.npubEncode(pubkey)
  }
}
