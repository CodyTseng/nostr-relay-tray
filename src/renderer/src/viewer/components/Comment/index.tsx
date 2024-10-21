import { Event } from '@nostr-relay/common'
import { formatTimestamp } from '@renderer/lib/timestamp'
import { useFetchProfile } from '@renderer/viewer/hooks'
import { Link } from 'react-router-dom'
import UserAvatar from '../UserAvatar'
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
      <UserAvatar avatar={avatar} userId={comment.pubkey} className="w-7 h-7" />
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
        <Content event={comment} />
      </div>
    </div>
  )
}

function ParentComment({ comment }: { comment: Event }) {
  const { avatar = '' } = useFetchProfile(comment.pubkey)

  return (
    <div className="flex space-x-1 items-center text-xs">
      <div>reply to</div>
      <UserAvatar avatar={avatar} userId={comment.pubkey} className="w-3 h-3" />
      <div className="truncate">{comment.content}</div>
    </div>
  )
}
