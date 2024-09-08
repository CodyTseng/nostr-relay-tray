import { ColumnType, Generated, Selectable } from 'kysely'
import { TRuleAction } from '../../common/rule'
import { TConfigKey } from '../../common/config'

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
  key: ColumnType<TConfigKey>
  value: string
}
export type TConfigRow = Selectable<IConfigTable>
