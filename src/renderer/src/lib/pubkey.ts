import { nip19 } from 'nostr-tools'

export function formatPubkey(pubkey: string) {
  const npub = pubkeyToNpub(pubkey)
  if (npub) {
    return formatNpub(npub)
  }
  return pubkey.slice(0, 4) + '...' + pubkey.slice(-4)
}

export function formatNpub(npub: string) {
  return npub.slice(0, 8) + '...' + npub.slice(-4)
}

export function pubkeyToNpub(pubkey: string) {
  try {
    return nip19.npubEncode(pubkey)
  } catch {
    return null
  }
}

export function userIdToPubkey(userId: string) {
  if (userId.startsWith('npub1')) {
    const { data } = nip19.decode(userId as `npub1${string}`)
    return data
  }
  return userId
}
