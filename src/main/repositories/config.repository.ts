import { Kysely } from 'kysely'
import { IDatabase } from './common'

export class ConfigRepository {
  constructor(private readonly db: Kysely<IDatabase>) {}

  async get(key: string) {
    const row = await this.db
      .selectFrom('config')
      .select('value')
      .where('key', '=', key)
      .executeTakeFirst()
    return row ? row.value : null
  }

  async set(key: string, value: string) {
    await this.db
      .insertInto('config')
      .values({ key, value })
      .onConflict((oc) => oc.column('key').doUpdateSet({ value }))
      .execute()
  }
}
