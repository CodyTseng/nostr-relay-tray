import { Event } from '@nostr-relay/common'
import { formatTimestamp } from '@renderer/lib/timestamp'
import { toNoStrudelNote } from '@renderer/lib/url'
import { useFetchProfile } from '@renderer/viewer/hooks'
import { kinds } from 'nostr-tools'
import { Link } from 'react-router-dom'
import Content from '../Content'
import UserAvatar from '../UserAvatar'
import Username from '../Username'

export default function Note({ event }: { event: Event }) {
  const { avatar = '', username } = useFetchProfile(event.pubkey)

  return (
    <div>
      <div className="flex items-center space-x-2">
        <UserAvatar avatar={avatar} userId={event.pubkey} className="w-9 h-9" />
        <div className="w-full overflow-hidden">
          <Username userId={event.pubkey} username={username} className="text-sm" />
          <div className="text-xs text-muted-foreground">{formatTimestamp(event.created_at)}</div>
        </div>
      </div>
      {[kinds.ShortTextNote].includes(event.kind) ? (
        <Content className="mt-2" event={event} />
      ) : (
        <Link
          to={toNoStrudelNote(event.id)}
          target="_blank"
          className="text-highlight hover:underline"
        >
          view on noStrudel
        </Link>
      )}
    </div>
  )
}
