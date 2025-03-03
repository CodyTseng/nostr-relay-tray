import { BeforeHandleEventPlugin, BeforeHandleEventResult, Event } from '@nostr-relay/common'
import { EventRepositorySqlite } from '@nostr-relay/event-repository-sqlite'
import { PowGuard } from '@nostr-relay/pow-guard'
import { WotGuard } from '@nostr-relay/wot-guard'
import dayjs from 'dayjs'
import { ipcMain } from 'electron'
import { nip19 } from 'nostr-tools'
import { CONFIG_KEY } from '../../common/config'
import { DEFAULT_POW_DIFFICULTY } from '../../common/constants'
import { RULE_ACTION, TRule } from '../../common/rule'
import { AllowGuard, BlockGuard } from '../guards/restriction.guard'
import { ConfigRepository } from '../repositories/config.repository'
import { RuleRepository } from '../repositories/rule.repository'
import { getAgent } from '../utils'

type WotGUardConfig = {
  enabled: boolean
  trustAnchor: string | undefined
  trustDepth: number
  refreshInterval: number
  refreshIntervalId: NodeJS.Timeout | null
  isRefreshing: boolean
}

export class GuardService implements BeforeHandleEventPlugin {
  private readonly wotGuard: WotGuard
  private readonly powGuard: PowGuard
  private readonly allowGuard: AllowGuard = new AllowGuard()
  private blockGuard: BlockGuard | null = null
  private guards = new Set<BeforeHandleEventPlugin>()
  private wotConfig: WotGUardConfig = {
    enabled: false,
    trustAnchor: undefined,
    trustDepth: 1,
    refreshInterval: 1,
    refreshIntervalId: null,
    isRefreshing: false
  }

  constructor(
    private readonly configRepository: ConfigRepository,
    private readonly ruleRepository: RuleRepository,
    eventRepository: EventRepositorySqlite
  ) {
    this.wotGuard = new WotGuard({
      enabled: false,
      trustDepth: 0,
      eventRepository,
      relayUrls: ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nos.lol']
    })
    this.powGuard = new PowGuard(DEFAULT_POW_DIFFICULTY)
  }

  async beforeHandleEvent(event: Event): Promise<BeforeHandleEventResult> {
    if (this.blockGuard) {
      const blockResult = this.blockGuard.beforeHandleEvent(event)
      if (!blockResult.canHandle) {
        return blockResult
      }
    }

    if (!this.guards.size) {
      return { canHandle: true }
    }

    const results = await Promise.all(
      Array.from(this.guards).map((guard) => guard.beforeHandleEvent(event))
    )

    for (const result of results) {
      if (result.canHandle) {
        return result
      }
    }
    return results[0]
  }

  async init() {
    const config = await this.configRepository.getMany([
      CONFIG_KEY.WOT_ENABLED,
      CONFIG_KEY.WOT_TRUST_ANCHOR,
      CONFIG_KEY.WOT_TRUST_DEPTH,
      CONFIG_KEY.WOT_REFRESH_INTERVAL,
      CONFIG_KEY.POW_DIFFICULTY
    ])

    // =================== WoT ===================
    this.wotConfig.enabled = config.get(CONFIG_KEY.WOT_ENABLED) === 'true'
    this.wotConfig.trustDepth = parseInt(config.get(CONFIG_KEY.WOT_TRUST_DEPTH) ?? '1')
    this.wotConfig.refreshInterval = parseInt(config.get(CONFIG_KEY.WOT_REFRESH_INTERVAL) ?? '1')
    this.wotConfig.trustAnchor = config.get(CONFIG_KEY.WOT_TRUST_ANCHOR)

    // =================== PoW ===================
    const powDifficultyStr = config.get(CONFIG_KEY.POW_DIFFICULTY)
    if (powDifficultyStr) {
      const powDifficulty = parseInt(powDifficultyStr)
      this.powGuard.setMinPowDifficulty(powDifficulty)
      if (powDifficulty > 0) {
        this.guards.add(this.powGuard)
      }
    }

    // =================== Rules ===================
    await this.updateRules()

    // =================== WoT ===================
    ipcMain.handle('wot:getEnabled', () => this.wotConfig.enabled)
    ipcMain.handle('wot:setEnabled', async (_, enabled: boolean) => {
      await this.setWotEnabled(enabled)
    })
    ipcMain.handle('wot:getTrustAnchor', () =>
      this.wotConfig.trustAnchor
        ? this.encodeHexPubkey(this.wotConfig.trustAnchor)
        : this.wotConfig.trustAnchor
    )
    ipcMain.handle('wot:setTrustAnchor', async (_, trustAnchor: string) => {
      await this.setWotTrustAnchor(trustAnchor)
    })
    ipcMain.handle('wot:getTrustDepth', () => this.wotConfig.trustDepth)
    ipcMain.handle('wot:setTrustDepth', async (_, trustDepth: number) => {
      await this.setWotTrustDepth(trustDepth)
    })
    ipcMain.handle('wot:getRefreshInterval', () => this.wotConfig.refreshInterval)
    ipcMain.handle('wot:setRefreshInterval', async (_, refreshInterval: number) => {
      await this.setWotRefreshInterval(refreshInterval)
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
    ipcMain.handle('wot:getIsRefreshing', () => this.wotConfig.isRefreshing)

    // =================== PoW ===================
    ipcMain.handle('pow:getPowDifficulty', () => this.powGuard.getMinPowDifficulty())
    ipcMain.handle('pow:setPowDifficulty', async (_, powDifficulty: number) => {
      await this.setPowDifficulty(powDifficulty)
    })

    // =================== Rules ===================
    ipcMain.handle('rule:find', (_, page: number, limit: number) =>
      this.ruleRepository.find(page, limit)
    )
    ipcMain.handle('rule:findById', (_, id: number) => this.ruleRepository.findById(id))
    ipcMain.handle('rule:update', async (_, id: number, rule: any) => {
      await this.ruleRepository.update(id, rule)
      await this.updateRules()
    })
    ipcMain.handle('rule:delete', async (_, id: number) => {
      await this.ruleRepository.delete(id)
      await this.updateRules()
    })
    ipcMain.handle('rule:create', async (_, rule: TRule) => {
      await this.ruleRepository.create(rule)
      await this.updateRules()
    })

    this.wotGuard.setTrustDepth(this.wotConfig.trustDepth)

    if (!this.wotConfig.enabled || !this.wotConfig.trustAnchor) {
      return
    }

    this.wotGuard.setTrustAnchorPubkey(this.wotConfig.trustAnchor)
    this.wotGuard.setEnabled(this.wotConfig.enabled)

    const agent = await getAgent('wss://relay.damus.io')
    if (agent) {
      this.wotGuard.setAgent(agent)
    }

    await this.refreshTrustedPubkeySet()
    this.guards.add(this.wotGuard)

    this.wotConfig.refreshIntervalId = setInterval(
      () => {
        this.refreshTrustedPubkeySet()
      },
      dayjs.duration({ hours: this.wotConfig.refreshInterval }).asMilliseconds()
    )
  }

  private async setWotEnabled(enabled: boolean) {
    if (this.wotConfig.enabled === enabled) {
      return
    }

    if (!this.wotConfig.trustAnchor) {
      throw new Error('Trust anchor is not set')
    }
    this.wotGuard.setTrustAnchorPubkey(this.wotConfig.trustAnchor)
    this.wotGuard.setEnabled(enabled)
    this.wotConfig.enabled = enabled
    await this.configRepository.set(CONFIG_KEY.WOT_ENABLED, enabled.toString())
    if (enabled) {
      await this.refreshTrustedPubkeySet()
      this.guards.add(this.wotGuard)
    } else {
      this.guards.delete(this.wotGuard)
    }
  }

  private async setWotTrustAnchor(npub: string) {
    this.wotConfig.trustAnchor = npub.length ? this.decodeNpub(npub) : ''
    this.wotGuard.setTrustAnchorPubkey(this.wotConfig.trustAnchor)
    await this.configRepository.set(CONFIG_KEY.WOT_TRUST_ANCHOR, this.wotConfig.trustAnchor)
  }

  private async setWotTrustDepth(trustDepth: number) {
    this.wotConfig.trustDepth = trustDepth
    this.wotGuard.setTrustDepth(trustDepth)
    await this.configRepository.set(CONFIG_KEY.WOT_TRUST_DEPTH, trustDepth.toString())
  }

  private async setWotRefreshInterval(refreshInterval: number) {
    this.wotConfig.refreshInterval = refreshInterval
    if (this.wotConfig.refreshIntervalId) {
      clearInterval(this.wotConfig.refreshIntervalId)
    }
    this.wotConfig.refreshIntervalId = setInterval(
      () => {
        this.refreshTrustedPubkeySet()
      },
      dayjs.duration({ hours: this.wotConfig.refreshInterval }).asMilliseconds()
    )
    await this.configRepository.set(CONFIG_KEY.WOT_REFRESH_INTERVAL, refreshInterval.toString())
  }

  private async refreshTrustedPubkeySet() {
    if (this.wotConfig.isRefreshing) {
      return
    }
    this.wotConfig.isRefreshing = true
    const timeout = setTimeout(
      () => {
        this.wotConfig.isRefreshing = false
      },
      dayjs.duration({ minutes: 5 }).asMilliseconds()
    )

    await this.wotGuard.refreshTrustedPubkeySet()

    this.wotConfig.isRefreshing = false
    clearTimeout(timeout)
  }

  private async setPowDifficulty(powDifficulty: number) {
    await this.configRepository.set(CONFIG_KEY.POW_DIFFICULTY, powDifficulty.toString())
    this.powGuard.setMinPowDifficulty(powDifficulty)
    if (powDifficulty > 0) {
      this.guards.add(this.powGuard)
    } else {
      this.guards.delete(this.powGuard)
    }
  }

  private decodeNpub(npub: string) {
    return nip19.decode(npub).data as string
  }

  private encodeHexPubkey(pubkey: string) {
    return nip19.npubEncode(pubkey)
  }

  private async updateRules() {
    const rules = await this.ruleRepository.findAll({
      enabled: true
    })
    const blockRules = rules.filter((rule) => rule.action === RULE_ACTION.BLOCK)
    const allowRules = rules.filter((rule) => rule.action === RULE_ACTION.ALLOW)

    if (blockRules.length === 0) {
      this.blockGuard = null
    } else if (!this.blockGuard) {
      this.blockGuard = new BlockGuard()
      this.blockGuard.updateFiltersByRules(blockRules)
    } else {
      this.blockGuard.updateFiltersByRules(blockRules)
    }

    if (allowRules.length === 0) {
      this.guards.delete(this.allowGuard)
    } else {
      this.allowGuard.updateFiltersByRules(allowRules)
      this.guards.add(this.allowGuard)
    }
  }
}
