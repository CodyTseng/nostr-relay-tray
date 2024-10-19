import reactStringReplace from 'react-string-replace'
import { TEmbeddedRenderer } from './types'

export * from './EmbeddedNostrEvent'
export * from './EmbeddedHashtag'
export * from './EmbeddedNostrNpub'
export * from './EmbeddedNormalUrl'
export * from './EmbeddedNostrNote'

export function embedded(content: string, renderers: TEmbeddedRenderer[]) {
  let nodes: React.ReactNode[] = [content]

  renderers.forEach((renderer) => {
    nodes = reactStringReplace(nodes, renderer.regex, renderer.render)
  })

  return nodes
}
