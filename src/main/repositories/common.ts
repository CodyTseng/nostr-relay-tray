import { Generated, Selectable } from 'kysely'
import { TRuleAction } from '../../common/rule'

export interface IDatabase {
  rule: IRuleTable
  config: IConfigTable
}

export interface IRuleTable {
  id: Generated<number>
  name: string
  description?: string
  action: TRuleAction
  enabled: number
  conditions: string
}
export type TRuleRow = Selectable<IRuleTable>

export interface IConfigTable {
  key: string
  value: string
}
export type TConfigRow = Selectable<IConfigTable>
