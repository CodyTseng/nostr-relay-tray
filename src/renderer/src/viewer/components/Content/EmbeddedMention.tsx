import { formatNpub } from '@renderer/lib/pubkey'
import { nip19 } from 'nostr-tools'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function EmbeddedMention({ id }: { id: string }) {
  const [username, setUsername] = useState<string | null>(null)

  const npub1 = id.split(':')[1] as `npub1${string}`

  const init = async () => {
    try {
      const { data } = nip19.decode(npub1)
      const events = await window.api.relay.findEvents({
        authors: [data],
        kinds: [0],
        limit: 1
      })
      if (!events.length) return
      const profile = JSON.parse(events[0].content)
      setUsername(profile.display_name ?? profile.name ?? formatNpub(npub1))
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    init()
  }, [])

  return username ? (
    <Link
      to={`/profile/${npub1}`}
      onClick={(e) => {
        e.stopPropagation()
        console.log('url', `/profile/${npub1}`)
      }}
      className="text-highlight hover:underline"
    >
      @{username}
    </Link>
  ) : (
    <Link
      to={`https://nostrudel.ninja/#/u/${npub1}`}
      target="_blank"
      className="text-highlight hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      @{formatNpub(npub1)}
    </Link>
  )
}

export default function renderEmbeddedMention(id: string, index: number) {
  return <EmbeddedMention key={`embedded-mention-${index}`} id={id} />
}
