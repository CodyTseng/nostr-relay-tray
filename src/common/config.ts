import { TTheme, TTrayImageColor } from './constants'
import { TRuleAction } from './rule'

export const CONFIG_KEY = {
  DEFAULT_EVENT_ACTION: 'default_event_action',
  WSS_MAX_PAYLOAD: 'wss_max_payload',
  DEFAULT_FILTER_LIMIT: 'default_filter_limit',
  TRAY_IMAGE_COLOR: 'tray_image_color',
  THEME: 'theme',
  HUB_ENABLED: 'hub_enabled',
  HUB_URL: 'hub_url'
} as const
export type TConfigKey = (typeof CONFIG_KEY)[keyof typeof CONFIG_KEY]

export type TConfig = {
  [CONFIG_KEY.DEFAULT_EVENT_ACTION]: TRuleAction
  [CONFIG_KEY.WSS_MAX_PAYLOAD]: number
  [CONFIG_KEY.DEFAULT_FILTER_LIMIT]: number
  [CONFIG_KEY.TRAY_IMAGE_COLOR]: TTrayImageColor
  [CONFIG_KEY.THEME]: TTheme
  [CONFIG_KEY.HUB_ENABLED]: boolean
  [CONFIG_KEY.HUB_URL]: string
}
