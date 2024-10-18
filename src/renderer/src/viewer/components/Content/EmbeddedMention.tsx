import { formatNpub } from '@renderer/lib/pubkey'
import useFetchProfile from '@renderer/viewer/hooks/useFetchProfile'
import { Link } from 'react-router-dom'

function EmbeddedMention({ id }: { id: string }) {
  const { username = null, npub } = useFetchProfile(id)

  return username && npub ? (
    <Link
      to={`/profile/${npub}`}
      onClick={(e) => e.stopPropagation()}
      className="text-highlight hover:underline"
    >
      @{username}
    </Link>
  ) : npub ? (
    <Link
      to={`https://nostrudel.ninja/#/u/${npub}`}
      target="_blank"
      className="text-highlight hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      @{npub ? formatNpub(npub) : id}
    </Link>
  ) : (
    <span className="text-highlight hover:underline" onClick={(e) => e.stopPropagation()}>
      @{npub ? formatNpub(npub) : id}
    </span>
  )
}

export default function renderEmbeddedMention(id: string, index: number) {
  return <EmbeddedMention key={`embedded-mention-${index}`} id={id} />
}
