import { Event } from '@nostr-relay/common'
import {
  embedded,
  embeddedNostrEventRenderer,
  embeddedHashtagRenderer,
  embeddedNostrNpubRenderer,
  embeddedNormalUrlRenderer,
  embeddedNostrNoteRenderer
} from '@renderer/viewer/embedded'
import ImageGallery from './ImageGallery'

export default function Content({ event, className }: { event: Event; className?: string }) {
  const { content, images } = extractMediaUrls(event.content)

  const nodes = embedded(content, [
    embeddedNormalUrlRenderer,
    embeddedHashtagRenderer,
    embeddedNostrNoteRenderer,
    embeddedNostrEventRenderer,
    embeddedNostrNpubRenderer
  ])

  // Add images
  if (images.length) {
    nodes.push(<ImageGallery key="images" images={images} />)
  }

  return <div className={className}>{nodes}</div>
}

function extractMediaUrls(content: string) {
  const urlRegex = /(https?:\/\/[^\s"']+)/g
  const urls = content.match(urlRegex) || []

  let c = content
  const images: string[] = []

  urls.forEach((url) => {
    if (isImage(url)) {
      c = c.replace(url, '')
      images.push(url)
    }
  })

  return { content: c, images }
}

function isImage(url: string) {
  try {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', 'webp']
    return imageExtensions.some((ext) => new URL(url).pathname.toLowerCase().endsWith(ext))
  } catch {
    return false
  }
}
