import { EmbeddedHashtag } from '../components/Embedded'
import { TEmbeddedRenderer } from './types'

export const embeddedHashtagRenderer: TEmbeddedRenderer = {
  regex: /#(\S+)/g,
  render: (hashtag: string, index: number) => {
    return <EmbeddedHashtag key={`hashtag-${index}`} hashtag={hashtag} />
  }
}
