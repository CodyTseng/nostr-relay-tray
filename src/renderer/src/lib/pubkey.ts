import { nip19 } from 'nostr-tools'

export function formatPubkey(pubkey: string) {
  try {
    const npub = nip19.npubEncode(pubkey)
    return formatNpub(npub)
  } catch {
    return pubkey.slice(0, 4) + '...' + pubkey.slice(-4)
  }
}

export function formatNpub(npub: string) {
  return npub.slice(0, 8) + '...' + npub.slice(-4)
}
