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

export const FIPS_ACCESS_MODE = {
  /** Any node on the fips mesh may connect. */
  OPEN: 'open',
  /** Only the listed npubs may connect. */
  WHITELIST: 'whitelist'
} as const
export type TFipsAccessMode = (typeof FIPS_ACCESS_MODE)[keyof typeof FIPS_ACCESS_MODE]

export const RELAY_PORT = 4869

/**
 * How other mesh nodes address this relay. The fips resolver maps
 * `<npub>.fips` to the node's derived address, so this is the form peers use --
 * the raw IPv6 is an implementation detail they never need to type.
 */
export function getMeshRelayUrl(npub: string) {
  return `ws://${npub}.fips:${RELAY_PORT}`
}

/**
 * Shortened form for places with limited width, such as the tray menu. The full
 * URL is still what gets copied.
 */
export function getMeshRelayUrlLabel(npub: string) {
  const short = npub.length > 20 ? `${npub.slice(0, 10)}...${npub.slice(-6)}` : npub
  return `ws://${short}.fips:${RELAY_PORT}`
}

export const FIPS_DROPIN_PATH = `/etc/fips/fips.d/rule-${RELAY_PORT}-tcp.nft`

/**
 * The one-time root command that opens the relay port on the mesh interface.
 * Only the port needs opening -- which npubs may connect is enforced by the
 * app, so this rule never has to change.
 */
export const FIPS_OPEN_PORT_COMMAND = [
  `printf 'tcp dport ${RELAY_PORT} accept\\n' | sudo tee ${FIPS_DROPIN_PATH}`,
  'sudo nft -f /etc/fips/fips.nft'
].join('\n')

export const FIPS_CLOSE_PORT_COMMAND = [
  `sudo rm ${FIPS_DROPIN_PATH}`,
  'sudo nft -f /etc/fips/fips.nft'
].join('\n')
