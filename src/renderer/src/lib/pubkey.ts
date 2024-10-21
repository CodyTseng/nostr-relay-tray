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

export function generateImageByPubkey(pubkey: string, aspectRatio: number = 1): string {
  // Split into 3 parts for colors and the rest for control points
  const colors: string[] = []
  const controlPoints: string[] = []
  for (let i = 0; i < 10; i++) {
    const part = pubkey.slice(i * 6, (i + 1) * 6)
    if (i < 3) {
      colors.push(`#${part}`)
    } else {
      controlPoints.push(part)
    }
  }

  // Calculate width and height based on aspect ratio
  const width = 100
  const height = 100 / aspectRatio

  // Generate SVG with multiple radial gradients
  const gradients = controlPoints
    .map((point, index) => {
      const cx = parseInt(point.slice(0, 2), 16) % 100
      const cy = parseInt(point.slice(2, 4), 16) % 100
      const r = (parseInt(point.slice(4, 6), 16) % 35) + 30
      const c = colors[index % (colors.length - 1)]

      return `
        <radialGradient id="grad${index}-${pubkey}" cx="${cx}%" cy="${cy}%" r="${r}%">
          <stop offset="0%" style="stop-color:${c};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${c};stop-opacity:0" />
        </radialGradient>
        <rect width="100%" height="100%" fill="url(#grad${index}-${pubkey})" />
      `
    })
    .join('')

  const image = `
    <svg width="${width}" height="${height}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${colors[2]}" fill-opacity="0.3" />
      ${gradients}
    </svg>
  `
  return `data:image/svg+xml;base64,${btoa(image)}`
}
