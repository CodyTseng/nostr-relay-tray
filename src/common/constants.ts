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

export const DEFAULT_WSS_MAX_PAYLOAD = 256

export const DEFAULT_FILTER_LIMIT = 100

export const DEFAULT_POW_DIFFICULTY = 0

export const PROXY_CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected'
} as const
export type TProxyConnectionStatus =
  (typeof PROXY_CONNECTION_STATUS)[keyof typeof PROXY_CONNECTION_STATUS]
