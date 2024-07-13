import { TTheme, TTrayImageColor } from './constants'
import { TRuleAction } from './rule'

export const CONFIG_KEY = {
  DEFAULT_EVENT_ACTION: 'default_event_action',
  WSS_MAX_PAYLOAD: 'wss_max_payload',
  TRAY_IMAGE_COLOR: 'tray_image_color',
  THEME: 'theme'
} as const
export type TConfigKey = (typeof CONFIG_KEY)[keyof typeof CONFIG_KEY]

export const DEFAULT_WSS_MAX_PAYLOAD = 256

export type TConfig = {
  [CONFIG_KEY.DEFAULT_EVENT_ACTION]: TRuleAction
  [CONFIG_KEY.WSS_MAX_PAYLOAD]: number
  [CONFIG_KEY.TRAY_IMAGE_COLOR]: TTrayImageColor
  [CONFIG_KEY.THEME]: TTheme
}
