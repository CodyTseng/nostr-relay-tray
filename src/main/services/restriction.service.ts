import { ipcMain } from 'electron'
import { CONFIG_KEY } from '../../common/config'
import { RULE_ACTION, TRule, TRuleAction } from '../../common/rule'
import { RestrictionPlugin } from '../plugins/restriction.plugin'
import { ConfigRepository } from '../repositories/config.repository'
import { RuleRepository } from '../repositories/rule.repository'

export class RestrictionService {
  private defaultEventAction: TRuleAction = RULE_ACTION.ALLOW
  private restrictionPlugin: RestrictionPlugin = new RestrictionPlugin()

  constructor(
    private readonly ruleRepository: RuleRepository,
    private readonly configRepository: ConfigRepository
  ) {}

  async init() {
    this.defaultEventAction =
      ((await this.configRepository.get(CONFIG_KEY.DEFAULT_EVENT_ACTION)) as TRuleAction | null) ??
      RULE_ACTION.ALLOW
    await this.updateRestriction()

    ipcMain.handle('rule:find', (_, page: number, limit: number) =>
      this.ruleRepository.find(page, limit)
    )
    ipcMain.handle('rule:findById', (_, id: number) => this.ruleRepository.findById(id))
    ipcMain.handle('rule:update', async (_, id: number, rule: any) => {
      await this.ruleRepository.update(id, rule)
      await this.updateRestriction()
    })
    ipcMain.handle('rule:delete', async (_, id: number) => {
      await this.ruleRepository.delete(id)
      await this.updateRestriction()
    })
    ipcMain.handle('rule:create', async (_, rule: TRule) => {
      await this.ruleRepository.create(rule)
      await this.updateRestriction()
    })
    ipcMain.handle('rule:getDefaultEventAction', () => this.defaultEventAction)
    ipcMain.handle('rule:setDefaultEventAction', async (_, action: TRuleAction) =>
      this.setDefaultEventAction(action)
    )
  }

  getRestrictionPlugin() {
    return this.restrictionPlugin
  }

  private async setDefaultEventAction(action: TRuleAction) {
    this.defaultEventAction = action
    await this.configRepository.set(CONFIG_KEY.DEFAULT_EVENT_ACTION, action)
    await this.updateRestriction()
  }

  private async updateRestriction() {
    this.restrictionPlugin.updateDefaultAction(this.defaultEventAction)

    const rules = await this.ruleRepository.findAll({
      action: this.defaultEventAction === RULE_ACTION.ALLOW ? RULE_ACTION.BLOCK : RULE_ACTION.ALLOW,
      enabled: true
    })
    this.restrictionPlugin.updateFiltersByRules(rules)
  }
}
