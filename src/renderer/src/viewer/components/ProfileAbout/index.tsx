import {
  embedded,
  embeddedHashtagRenderer,
  embeddedNormalUrlRenderer
} from '@renderer/viewer/embedded'
import { embeddedNpubRenderer } from '@renderer/viewer/embedded/EmbeddedNpub'

export default function ProfileAbout({ about }: { about?: string }) {
  const nodes = about
    ? embedded(about, [embeddedNormalUrlRenderer, embeddedNpubRenderer, embeddedHashtagRenderer])
    : null

  return <>{nodes}</>
}
