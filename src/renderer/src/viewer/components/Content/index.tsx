import { Event } from '@nostr-relay/common'
import { isNsfwEvent } from '@renderer/lib/event'
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
import VideoPlayer from '../VideoPlayer'

export default function Content({ event, className }: { event: Event; className?: string }) {
  const { content, images, videos } = extractMediaUrls(event.content)
  const isNsfw = isNsfwEvent(event)

  const nodes = embedded(content, [
    embeddedNormalUrlRenderer,
    embeddedHashtagRenderer,
    embeddedNostrNoteRenderer,
    embeddedNostrEventRenderer,
    embeddedNostrNpubRenderer
  ])

  // Add images
  if (images.length) {
    nodes.push(
      <ImageGallery className="mt-2 w-fit max-h-60" key="images" images={images} isNsfw={isNsfw} />
    )
  }

  // Add videos
  if (videos.length) {
    videos.forEach((src, index) => {
      nodes.push(<VideoPlayer className="mt-2" key={`video-${index}`} src={src} isNsfw={isNsfw} />)
    })
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
  const videos: string[] = []

  urls.forEach((url) => {
    if (isImage(url)) {
      c = c.replace(url, '').trim()
      images.push(url)
    } else if (isVideo(url)) {
      c = c.replace(url, '').trim()
      videos.push(url)
    }
  })

  return { content: c, images, videos }
}

function isImage(url: string) {
  try {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', 'webp']
    return imageExtensions.some((ext) => new URL(url).pathname.toLowerCase().endsWith(ext))
  } catch {
    return false
  }
}

function isVideo(url: string) {
  try {
    const videoExtensions = ['.mp4', '.webm', '.ogg']
    return videoExtensions.some((ext) => new URL(url).pathname.toLowerCase().endsWith(ext))
  } catch {
    return false
  }
}
