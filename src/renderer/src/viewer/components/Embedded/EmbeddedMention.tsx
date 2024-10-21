import { toNoStrudelProfile } from '@renderer/lib/url'
import { useFetchProfile } from '@renderer/viewer/hooks'
import { Link } from 'react-router-dom'
import Username from '../Username'

export function EmbeddedMention({ userId }: { userId: string }) {
  const { username, pubkey, hasProfile } = useFetchProfile(userId)

  return hasProfile ? (
    <Username userId={pubkey} username={username} showAt className="text-highlight font-normal" />
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
