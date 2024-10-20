import { Event } from '@nostr-relay/common'
import { cn } from '@renderer/lib/utils'
import {
  embedded,
  embeddedHashtagRenderer,
  embeddedNormalUrlRenderer,
  embeddedNostrEventRenderer,
  embeddedNostrNoteRenderer,
  embeddedNostrNpubRenderer
} from '@renderer/viewer/embedded'
import ImageGallery from '../ImageGallery'

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
    nodes.push(<ImageGallery className="mt-2" key="images" images={images} />)
  }

  return (
    <div className={cn('text-sm text-wrap break-words whitespace-pre-wrap', className)}>
      {nodes}
    </div>
  )
}

function extractMediaUrls(content: string) {
  const urlRegex = /(https?:\/\/[^\s"']+)/g
  const urls = content.match(urlRegex) || []

  let c = content
  const images: string[] = []

  urls.forEach((url) => {
    if (isImage(url)) {
      c = c.replace(url, '').trim()
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
