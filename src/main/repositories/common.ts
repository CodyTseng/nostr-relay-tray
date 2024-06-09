import { Generated, Selectable } from 'kysely'
import { TRuleAction } from '../../common/rule'

export interface IDatabase {
  rule: IRuleTable
}

export interface IRuleTable {
  id: Generated<number>
  name: string
  description?: string
  action: TRuleAction
  enabled: number
  filter: string
  conditions: string
}
export type TRuleRow = Selectable<IRuleTable>
