export const TRAY_IMAGE_COLOR = {
  BLACK: 'BLACK',
  WHITE: 'WHITE',
  PURPLE: 'PURPLE'
}
export type TTrayImageColor = (typeof TRAY_IMAGE_COLOR)[keyof typeof TRAY_IMAGE_COLOR]

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
}
export type TTheme = (typeof THEME)[keyof typeof THEME]

export const HUB_CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected'
} as const
export type THubConnectionStatus =
  (typeof HUB_CONNECTION_STATUS)[keyof typeof HUB_CONNECTION_STATUS]

export const DEFAULT_HUB_URL = 'wss://hub.nostr-relay.app/join'

export const DEFAULT_WSS_MAX_PAYLOAD = 256

export const DEFAULT_FILTER_LIMIT = 100
