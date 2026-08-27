import { sha256 } from '@noble/hashes/sha256'
import { hexToBytes } from '@noble/hashes/utils'
import { nip19 } from 'nostr-tools'

/**
 * Every FIPS mesh address starts with this byte. Only the first byte is fixed --
 * the remaining 15 are hash output, so `fd97:` and friends are not prefixes to
 * match against, they are just one node out of 256.
 */
export const FIPS_ADDRESS_PREFIX = 0xfd

/**
 * Derive a node's mesh address from its 32-byte x-only public key.
 *
 * Mirrors `NodeAddr::from_pubkey` + `FipsAddress::from_node_addr` in the fips
 * daemon: the node address is sha256(pubkey) truncated to 16 bytes, and the
 * IPv6 address is its first 15 bytes behind the 0xfd prefix.
 *
 *   ipv6 = 0xfd || sha256(pubkey)[0..15]
 */
export function pubkeyToMeshAddress(pubkey: string): string {
  const hash = sha256(hexToBytes(pubkey))
  const bytes = new Uint8Array(16)
  bytes[0] = FIPS_ADDRESS_PREFIX
  bytes.set(hash.subarray(0, 15), 1)
  return formatIpv6(bytes)
}

export function npubToMeshAddress(npub: string): string {
  const decoded = nip19.decode(npub)
  if (decoded.type !== 'npub') {
    throw new Error(`Expected an npub, got ${decoded.type}`)
  }
  return pubkeyToMeshAddress(decoded.data as string)
}

/**
 * Parse an IPv6 string into its 16 bytes, tolerating '::' compression, a zone
 * id, brackets, and a trailing IPv4 form. Returns null when it isn't a valid
 * address -- callers treat that as "deny".
 */
export function parseIpv6(value: string): Uint8Array | null {
  let address = value.trim()

  const zoneIndex = address.indexOf('%')
  if (zoneIndex >= 0) address = address.slice(0, zoneIndex)
  if (address.startsWith('[') && address.endsWith(']')) address = address.slice(1, -1)

  // '::ffff:127.0.0.1' style tails become two ordinary groups.
  const v4Match = address.match(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (v4Match) {
    const octets = v4Match.slice(1).map((part) => Number(part))
    if (octets.some((octet) => octet > 255)) return null
    const high = ((octets[0] << 8) | octets[1]).toString(16)
    const low = ((octets[2] << 8) | octets[3]).toString(16)
    address = address.slice(0, v4Match.index) + `${high}:${low}`
  }

  const parts = address.split('::')
  if (parts.length > 2) return null

  const split = (part: string) => (part ? part.split(':') : [])
  const head = split(parts[0])
  const tail = parts.length === 2 ? split(parts[1]) : []

  let groups: string[]
  if (parts.length === 1) {
    if (head.length !== 8) return null
    groups = head
  } else {
    const missing = 8 - head.length - tail.length
    if (missing < 1) return null
    groups = [...head, ...new Array(missing).fill('0'), ...tail]
  }

  const bytes = new Uint8Array(16)
  for (let i = 0; i < 8; i++) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(groups[i])) return null
    const value = parseInt(groups[i], 16)
    bytes[i * 2] = value >> 8
    bytes[i * 2 + 1] = value & 0xff
  }
  return bytes
}

/**
 * Canonical form of an address, so values from different sources (the daemon,
 * a socket's remoteAddress, our own derivation) compare as strings.
 */
export function normalizeIpv6(value: string): string | null {
  const bytes = parseIpv6(value)
  return bytes ? formatIpv6(bytes) : null
}

/**
 * Format 16 bytes as an RFC 5952 canonical IPv6 string, so addresses we derive
 * compare equal to the ones the daemon reports.
 */
function formatIpv6(bytes: Uint8Array): string {
  const groups: number[] = []
  for (let i = 0; i < 16; i += 2) {
    groups.push((bytes[i] << 8) | bytes[i + 1])
  }

  // Longest run of two or more zero groups collapses to '::', leftmost wins.
  let bestStart = -1
  let bestLength = 0
  let start = -1
  for (let i = 0; i <= groups.length; i++) {
    if (i < groups.length && groups[i] === 0) {
      if (start < 0) start = i
    } else if (start >= 0) {
      const length = i - start
      if (length > bestLength) {
        bestStart = start
        bestLength = length
      }
      start = -1
    }
  }

  const hex = groups.map((group) => group.toString(16))
  if (bestLength < 2) {
    return hex.join(':')
  }
  const head = hex.slice(0, bestStart).join(':')
  const tail = hex.slice(bestStart + bestLength).join(':')
  return `${head}::${tail}`
}
