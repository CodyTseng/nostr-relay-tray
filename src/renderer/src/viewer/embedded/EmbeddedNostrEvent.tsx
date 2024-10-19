import { EmbeddedNote } from '../components/Embedded'
import { TEmbeddedRenderer } from './types'

export const embeddedNostrEventRenderer: TEmbeddedRenderer = {
  regex: /(nostr:nevent1[a-z0-9]+)/g,
  render: (nostrId: string, index: number) => {
    const id = nostrId.split(':')[1]
    return <EmbeddedNote key={`embedded-event-${index}`} id={id} />
  }
}
