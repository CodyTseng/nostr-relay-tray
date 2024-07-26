import { Kysely } from 'kysely'
import { CONFIG_KEY, TConfig } from '../../common/config'
import {
  DEFAULT_FILTER_LIMIT,
  DEFAULT_HUB_URL,
  DEFAULT_WSS_MAX_PAYLOAD,
  THEME,
  TRAY_IMAGE_COLOR
} from '../../common/constants'
import { RULE_ACTION } from '../../common/rule'
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

  async getAll(): Promise<TConfig> {
    const rows = await this.db.selectFrom('config').selectAll().execute()
    const rawConfig = rows.reduce((acc, row) => {
      acc[row.key] = row.value
      return acc
    }, {})
    return {
      [CONFIG_KEY.DEFAULT_EVENT_ACTION]:
        rawConfig[CONFIG_KEY.DEFAULT_EVENT_ACTION] ?? RULE_ACTION.ALLOW,
      [CONFIG_KEY.WSS_MAX_PAYLOAD]: rawConfig[CONFIG_KEY.WSS_MAX_PAYLOAD]
        ? parseInt(rawConfig[CONFIG_KEY.WSS_MAX_PAYLOAD])
        : DEFAULT_WSS_MAX_PAYLOAD,
      [CONFIG_KEY.DEFAULT_FILTER_LIMIT]: rawConfig[CONFIG_KEY.DEFAULT_FILTER_LIMIT]
        ? parseInt(rawConfig[CONFIG_KEY.DEFAULT_FILTER_LIMIT])
        : DEFAULT_FILTER_LIMIT,
      [CONFIG_KEY.TRAY_IMAGE_COLOR]:
        rawConfig[CONFIG_KEY.TRAY_IMAGE_COLOR] ?? TRAY_IMAGE_COLOR.BLACK,
      [CONFIG_KEY.THEME]: rawConfig[CONFIG_KEY.THEME] ?? THEME.SYSTEM,
      [CONFIG_KEY.HUB_ENABLED]: rawConfig[CONFIG_KEY.HUB_ENABLED] === 'true',
      [CONFIG_KEY.HUB_URL]: rawConfig[CONFIG_KEY.HUB_URL] ?? DEFAULT_HUB_URL
    }
  }

  async set(key: string, value: string) {
    await this.db
      .insertInto('config')
      .values({ key, value })
      .onConflict((oc) => oc.column('key').doUpdateSet({ value }))
      .execute()
  }
}
