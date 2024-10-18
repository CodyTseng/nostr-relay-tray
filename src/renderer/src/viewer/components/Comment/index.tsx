import { Event } from '@nostr-relay/common'
import { Avatar, AvatarFallback, AvatarImage } from '@renderer/components/ui/avatar'
import { formatPubkey } from '@renderer/lib/pubkey'
import { formatTimestamp } from '@renderer/lib/timestamp'
import useFetchProfile from '@renderer/viewer/hooks/useFetchProfile'
import Content from '../Content'

export default function Comment({
  comment,
  parentComment
}: {
  comment: Event
  parentComment?: Event
}) {
  const { avatar = '', username = formatPubkey(comment.pubkey) } = useFetchProfile(comment.pubkey)

  return (
    <div className="flex space-x-2 items-start">
      <Avatar className="w-7 h-7">
        <AvatarImage src={avatar} />
        <AvatarFallback>{username}</AvatarFallback>
      </Avatar>
      <div className="w-full overflow-hidden">
        <div className="flex space-x-2 items-center">
          <div className="text-sm font-semibold truncate">{username}</div>
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
