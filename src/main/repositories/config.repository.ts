import { Kysely } from 'kysely'
import { TConfigKey } from '../../common/config'
import { IDatabase } from './common'

export class ConfigRepository {
  constructor(private readonly db: Kysely<IDatabase>) {}

  async get(key: TConfigKey) {
    const row = await this.db
      .selectFrom('config')
      .select('value')
      .where('key', '=', key)
      .executeTakeFirst()
    return row ? row.value : null
  }

  async getMany(keys: TConfigKey[]) {
    const rows = await this.db
      .selectFrom('config')
      .select(['key', 'value'])
      .where('key', 'in', keys)
      .execute()
    const result = new Map<TConfigKey, string>()
    for (const row of rows) {
      result.set(row.key, row.value)
    }
    return result
  }

  async set(key: TConfigKey, value: string) {
    await this.db
      .insertInto('config')
      .values({ key, value })
      .onConflict((oc) => oc.column('key').doUpdateSet({ value }))
      .execute()
  }
}
