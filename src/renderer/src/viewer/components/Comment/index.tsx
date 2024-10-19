import { Event } from '@nostr-relay/common'
import { Avatar, AvatarFallback, AvatarImage } from '@renderer/components/ui/avatar'
import { formatTimestamp } from '@renderer/lib/timestamp'
import { useFetchProfile } from '@renderer/viewer/hooks'
import { Link } from 'react-router-dom'
import Content from '../Content'

export default function Comment({
  comment,
  parentComment
}: {
  comment: Event
  parentComment?: Event
}) {
  const { avatar = '', username } = useFetchProfile(comment.pubkey)

  return (
    <div className="flex space-x-2 items-start">
      <Link to={`/profile/${comment.pubkey}`} onClick={(e) => e.stopPropagation()}>
        <Avatar className="w-7 h-7">
          <AvatarImage src={avatar} />
          <AvatarFallback>{username}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="w-full overflow-hidden">
        <div className="flex space-x-2 items-center">
          <Link
            to={`/profile/${comment.pubkey}`}
            className="text-sm font-semibold truncate hover:underline"
          >
            {username}
          </Link>
          <div className="text-xs text-muted-foreground">{formatTimestamp(comment.created_at)}</div>
        </div>
        {parentComment && (
          <div className="text-xs text-muted-foreground truncate">
            <ParentComment comment={parentComment} />
          </div>
        )}
        <Content className="text-sm text-wrap break-words whitespace-pre-wrap" event={comment} />
      </div>
    </div>
  )
}

function ParentComment({ comment }: { comment: Event }) {
  const { avatar } = useFetchProfile(comment.pubkey)

  return (
    <div className="flex space-x-1 items-center text-xs">
      <div>reply to</div>
      <Avatar className="w-3 h-3">
        <AvatarImage src={avatar} />
      </Avatar>
      <div className="truncate">{comment.content}</div>
    </div>
  )
}
