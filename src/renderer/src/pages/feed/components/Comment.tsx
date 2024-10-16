import { Event } from '@nostr-relay/common'
import { Avatar, AvatarFallback, AvatarImage } from '@renderer/components/ui/avatar'
import { formatPubkey } from '@renderer/lib/pubkey'
import { formatTimestamp } from '@renderer/lib/timestamp'
import { useEffect, useState } from 'react'

export default function Comment({
  comment,
  parentComment
}: {
  comment: Event
  parentComment?: Event
}) {
  const [username, setUsername] = useState<string>(formatPubkey(comment.pubkey))
  const [avatar, setAvatar] = useState<string>('')
  const [parentCommentUsername, setParentCommentUsername] = useState<string | undefined>(
    parentComment ? formatPubkey(parentComment.pubkey) : undefined
  )

  const init = async () => {
    const profileEvents = await window.api.relay.findEvents({
      authors: parentComment ? [comment.pubkey, parentComment.pubkey] : [comment.pubkey],
      kinds: [0],
      limit: 2
    })
    if (!profileEvents.length) return

    const profileEvent = profileEvents.find((e) => e.pubkey === comment.pubkey)
    const parentProfileEvent = profileEvents.find((e) => e.pubkey === parentComment?.pubkey)

    if (!profileEvent) return

    try {
      const profile = JSON.parse(profileEvent.content)
      const name = profile.display_name ?? profile.name
      if (name) setUsername(name)

      if (profile.picture) {
        setAvatar(profile.picture)
      }

      const parentProfile = parentProfileEvent ? JSON.parse(parentProfileEvent.content) : null
      if (parentProfile) {
        const parentName = parentProfile.display_name ?? parentProfile.name
        if (parentName) setParentCommentUsername(parentName)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    init()
  }, [])

  return (
    <div className="flex space-x-2">
      <Avatar className="w-9 h-9">
        <AvatarImage src={avatar} />
        <AvatarFallback>{username}</AvatarFallback>
      </Avatar>
      <div className="w-full overflow-hidden">
        <div className="text-sm font-semibold truncate">{username}</div>
        <div className="flex space-x-2">
          <div className="text-xs text-muted-foreground">{formatTimestamp(comment.created_at)}</div>
          {parentComment && (
            <div className="text-xs text-muted-foreground truncate">
              Reply to <span className="font-semibold">{parentCommentUsername}</span>
            </div>
          )}
        </div>
        <div className="text-sm text-wrap break-words whitespace-pre-wrap">{comment.content}</div>
      </div>
    </div>
  )
}
