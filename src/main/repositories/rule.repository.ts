import { Kysely } from 'kysely'
import { TNewRule, TRule, TRuleAction, TRuleCondition, TRuleUpdate } from '../../common/rule'
import { IDatabase, TRuleRow } from './common'

export class RuleRepository {
  constructor(private readonly db: Kysely<IDatabase>) {}

  async create(restriction: TNewRule) {
    await this.db
      .insertInto('rule')
      .values({
        name: restriction.name,
        description: restriction.description,
        action: restriction.action,
        enabled: restriction.enabled ? 1 : 0,
        conditions: JSON.stringify(restriction.conditions)
      })
      .execute()
  }

  async find(page = 1, pageSize = 10) {
    const rows = await this.db
      .selectFrom('rule')
      .selectAll()
      .orderBy('id', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute()
    return rows.map((row) => this.toRule(row))
  }

  async findById(id: number) {
    const row = await this.db.selectFrom('rule').selectAll().where('id', '=', id).executeTakeFirst()
    return row ? this.toRule(row) : null
  }

  async findAll(filter: { action?: TRuleAction; enabled?: boolean } = {}) {
    let query = this.db.selectFrom('rule').selectAll()

    if (filter.action) {
      query = query.where('action', '=', filter.action)
    }

    if (filter.enabled !== undefined) {
      query = query.where('enabled', '=', filter.enabled ? 1 : 0)
    }

    const rows = await query.execute()
    return rows.map((row) => this.toRule(row))
  }

  async update(id: number, restriction: TRuleUpdate) {
    await this.db
      .updateTable('rule')
      .set({
        name: restriction.name,
        description: restriction.description,
        action: restriction.action,
        enabled: restriction.enabled ? 1 : 0,
        conditions: restriction.conditions ? JSON.stringify(restriction.conditions) : undefined
      })
      .where('id', '=', id)
      .execute()
  }

  async delete(id: number) {
    await this.db.deleteFrom('rule').where('id', '=', id).execute()
  }

  private toRule(row: TRuleRow): TRule {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      action: row.action,
      enabled: row.enabled === 1 ? true : false,
      conditions: JSON.parse(row.conditions) as TRuleCondition[]
    }
  }
}
