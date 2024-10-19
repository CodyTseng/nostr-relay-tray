import { useFetchProfile } from '@renderer/viewer/hooks'
import { Link } from 'react-router-dom'

export function EmbeddedMention({ id }: { id: string }) {
  const { username, npub, hasProfile } = useFetchProfile(id)

  return hasProfile ? (
    <Link
      to={`/profile/${npub}`}
      onClick={(e) => e.stopPropagation()}
      className="text-highlight hover:underline"
    >
      @{username}
    </Link>
  ) : (
    <Link
      to={`https://nostrudel.ninja/#/u/${id}`}
      target="_blank"
      className="text-highlight hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      @{username}
    </Link>
  )
}
