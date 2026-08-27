import { TFipsAccessMode } from './constants'

export type TLog = {
  timestamp: number
  message: string
  data?: any
}

/**
 * What the fips nftables baseline (Linux only) does with the relay port.
 * 'not-applicable' means no baseline is installed, so nothing is filtering.
 */
export type TFipsFirewallStatus =
  | { kind: 'not-applicable' }
  | { kind: 'open' }
  | { kind: 'restricted'; sources: string[] }
  | { kind: 'blocked' }
  | { kind: 'unknown' }

export type TFipsState = {
  /** Whether the local fips daemon answered on its control socket. */
  daemonReachable: boolean
  tunName: string | null
  tunActive: boolean
  meshAddress: string | null
  npub: string | null
  peerCount: number
  enabled: boolean
  accessMode: TFipsAccessMode
  /** npubs allowed to connect while in whitelist mode. */
  allowedNpubs: string[]
  /** Whether the relay currently has a listener on the mesh address. */
  bound: boolean
  /** Read-only view of the kernel firewall; the app never changes it. */
  firewall: TFipsFirewallStatus
}
