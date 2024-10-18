import { Event } from '@nostr-relay/common'
import reactStringReplace from 'react-string-replace'
import renderHashtag from './Hashtag'
import renderNormalUrl from './NormalUrl'
import ImageGallery from './ImageGallery'
import renderEmbeddedNote from './EmbeddedNote'
import renderEmbeddedMention from './EmbeddedMention'

export default function Content({ event, className }: { event: Event; className?: string }) {
  const { content, images } = extractMediaUrls(event.content)

  let nodes: React.ReactNode[] = [content]

  // Match URLs
  nodes = reactStringReplace(nodes, /(https?:\/\/\S+)/g, renderNormalUrl)

  // Match hashtags
  nodes = reactStringReplace(nodes, /#(\S+)/g, renderHashtag)

  // Match note1
  nodes = reactStringReplace(nodes, /(nostr:note1[a-z0-9]{58})/g, renderEmbeddedNote)

  // Match mentions
  nodes = reactStringReplace(nodes, /(nostr:npub1[a-z0-9]{58})/g, renderEmbeddedMention)

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
