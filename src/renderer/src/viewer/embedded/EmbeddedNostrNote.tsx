import { EmbeddedNote } from '../components/Embedded'
import { TEmbeddedRenderer } from './types'

export const embeddedNostrNoteRenderer: TEmbeddedRenderer = {
  regex: /(nostr:note1[a-z0-9]{58})/g,
  render: (nostrId: string, index: number) => {
    const id = nostrId.split(':')[1]
    return <EmbeddedNote key={`embedded-note-${index}`} id={id} />
  }
}
