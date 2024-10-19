import { Event } from '@nostr-relay/common'
import { Avatar, AvatarFallback, AvatarImage } from '@renderer/components/ui/avatar'
import { formatTimestamp } from '@renderer/lib/timestamp'
import { useFetchProfile } from '@renderer/viewer/hooks'
import { toNoStrudelNote, toProfile } from '@renderer/viewer/lib/url'
import { kinds } from 'nostr-tools'
import { Link } from 'react-router-dom'
import Content from '../Content'

export default function Note({ event }: { event: Event }) {
  const { avatar = '', username } = useFetchProfile(event.pubkey)

  return (
    <div>
      <div className="flex items-center space-x-2">
        <Link to={toProfile(event.pubkey)} onClick={(e) => e.stopPropagation()}>
          <Avatar className="w-9 h-9">
            <AvatarImage src={avatar} />
            <AvatarFallback>{getAvatarFallback(username)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="w-full overflow-hidden">
          <Link
            to={toProfile(event.pubkey)}
            className="text-sm font-semibold truncate hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {username}
          </Link>
          <div className="text-xs text-muted-foreground">{formatTimestamp(event.created_at)}</div>
        </div>
      </div>
      {[kinds.ShortTextNote].includes(event.kind) ? (
        <Content className="mt-2 text-sm text-wrap break-words whitespace-pre-wrap" event={event} />
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

function getAvatarFallback(username: string) {
  return username.startsWith('npub1')
    ? username.slice(4, 2).toUpperCase()
    : username.replaceAll(' ', '').slice(0, 2).toUpperCase()
}
