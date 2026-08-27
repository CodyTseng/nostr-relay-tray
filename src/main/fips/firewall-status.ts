import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import path from 'path'
import { TFipsFirewallStatus } from '../../common/types'

/**
 * Files shipped by the fips package on Linux. The baseline in FIPS_NFT_FILE is
 * default-deny for inbound traffic on the tun interface, and drop-ins in
 * FIPS_DROPIN_DIR are what open individual ports.
 *
 * Read-only: opening a port needs root, so the app only reports what it finds
 * and tells the user what to run.
 */
const FIPS_NFT_FILE = '/etc/fips/fips.nft'
const FIPS_DROPIN_DIR = '/etc/fips/fips.d'

export function getFirewallStatus(port: number): TFipsFirewallStatus {
  // No nftables baseline means nothing is filtering the mesh interface.
  if (process.platform !== 'linux' || !existsSync(FIPS_NFT_FILE)) {
    return { kind: 'not-applicable' }
  }

  let files: string[]
  try {
    files = readdirSync(FIPS_DROPIN_DIR).filter((name) => name.endsWith('.nft'))
  } catch {
    // The baseline exists but the drop-in dir is unreadable or absent. The
    // baseline alone denies, so the port is closed.
    return existsSync(FIPS_DROPIN_DIR) ? { kind: 'unknown' } : { kind: 'blocked' }
  }

  const sources = new Set<string>()
  let openToAll = false

  for (const name of files) {
    const filePath = path.join(FIPS_DROPIN_DIR, name)
    let content: string
    try {
      if (!statSync(filePath).isFile()) continue
      content = readFileSync(filePath, 'utf8')
    } catch {
      return { kind: 'unknown' }
    }

    for (const rawLine of content.split('\n')) {
      const line = rawLine.split('#')[0].trim()
      if (!line || !/\baccept\b/.test(line) || !matchesPort(line, port)) continue

      // The character class includes '/' so CIDR sources keep their prefix length.
      const restricted = line.match(/ip6\s+saddr\s+(\{[^}]*\}|[0-9a-fA-F:./]+)/)
      if (!restricted) {
        openToAll = true
      } else {
        for (const source of splitList(restricted[1])) {
          sources.add(source)
        }
      }
    }
  }

  if (openToAll) return { kind: 'open' }
  if (sources.size > 0) return { kind: 'restricted', sources: [...sources] }
  return { kind: 'blocked' }
}

/** Handles `dport 4869`, `dport { 80, 4869 }`, and `dport 4000-5000`. */
function matchesPort(line: string, port: number): boolean {
  const match = line.match(/\btcp\s+dport\s+(\{[^}]*\}|[0-9]+(?:-[0-9]+)?)/)
  if (!match) return false

  return splitList(match[1]).some((entry) => {
    const range = entry.match(/^([0-9]+)-([0-9]+)$/)
    if (range) {
      return port >= Number(range[1]) && port <= Number(range[2])
    }
    return Number(entry) === port
  })
}

function splitList(value: string): string[] {
  return value
    .replace(/^\{|\}$/g, '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}
