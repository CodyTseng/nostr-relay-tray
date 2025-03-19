export const CONFIG_KEY = {
  WSS_MAX_PAYLOAD: 'wss_max_payload',
  DEFAULT_FILTER_LIMIT: 'default_filter_limit',
  TRAY_IMAGE_COLOR: 'tray_image_color',
  THEME: 'theme',
  HUB_ENABLED: 'hub_enabled',
  HUB_URL: 'hub_url',
  WOT_ENABLED: 'wot_enabled',
  WOT_TRUST_ANCHOR: 'wot_trust_anchor',
  WOT_TRUST_DEPTH: 'wot_trust_depth',
  WOT_REFRESH_INTERVAL: 'wot_refresh_interval',
  POW_DIFFICULTY: 'pow_difficulty',
  INIT_SEARCH_INDEX_CURSOR: 'init_search_index_cursor',
  PROXY_ENABLED: 'proxy_enabled',
  PRIVATE_KEY: 'private_key'
} as const
export type TConfigKey = (typeof CONFIG_KEY)[keyof typeof CONFIG_KEY]
