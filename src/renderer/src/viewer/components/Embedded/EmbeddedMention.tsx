import { useFetchProfile } from '@renderer/viewer/hooks'
import { toNoStrudelProfile, toProfile } from '@renderer/viewer/lib/url'
import { Link } from 'react-router-dom'

export function EmbeddedMention({ id }: { id: string }) {
  const { username, npub, hasProfile } = useFetchProfile(id)

  return hasProfile ? (
    <Link
      to={toProfile(npub)}
      onClick={(e) => e.stopPropagation()}
      className="text-highlight hover:underline"
    >
      @{username}
    </Link>
  ) : (
    <Link
      to={toNoStrudelProfile(id)}
      target="_blank"
      className="text-highlight hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      @{username}
    </Link>
  )
}
