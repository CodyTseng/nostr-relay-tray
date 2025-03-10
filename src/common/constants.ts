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
