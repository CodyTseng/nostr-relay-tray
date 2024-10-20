import { toNoStrudelProfile } from '@renderer/lib/url'
import { useFetchProfile } from '@renderer/viewer/hooks'
import { Link } from 'react-router-dom'
import ProfileTextLink from '../ProfileTextLink'

export function EmbeddedMention({ userId }: { userId: string }) {
  const { username, pubkey, hasProfile } = useFetchProfile(userId)

  return hasProfile ? (
    <ProfileTextLink userId={pubkey} className="text-highlight">
      @{username}
    </ProfileTextLink>
  ) : (
    <Link
      to={toNoStrudelProfile(userId)}
      target="_blank"
      className="text-highlight hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      @{username}
    </Link>
  )
}
