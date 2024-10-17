import { Event } from '@nostr-relay/common'
import { Avatar, AvatarFallback, AvatarImage } from '@renderer/components/ui/avatar'
import { Card } from '@renderer/components/ui/card'
import { formatPubkey } from '@renderer/lib/pubkey'
import { formatTimestamp } from '@renderer/lib/timestamp'
import { useEffect, useState } from 'react'
import { Content } from './Content'
import { cn } from '@renderer/lib/utils'

export default function Note({
  event,
  canClick = true,
  className = ''
}: {
  event?: Event
  canClick?: boolean
  className?: string
}) {
  const [username, setUsername] = useState<string>(event ? formatPubkey(event.pubkey) : 'username')
  const [avatar, setAvatar] = useState<string>('')

  const init = async () => {
    if (!event) return

    const [profileEvent] = await window.api.relay.findEvents({
      authors: [event.pubkey],
      kinds: [0],
      limit: 1
    })
    if (!profileEvent) return

    try {
      const profile = JSON.parse(profileEvent.content)
      const name = profile.display_name ?? profile.name
      if (name) setUsername(name)

      if (profile.picture) {
        setAvatar(profile.picture)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    init()
  }, [])

  return (
    <Card className={cn('p-4', canClick ? 'hover:bg-muted' : '', className)}>
      <div className="flex items-center space-x-2">
        <Avatar className="w-9 h-9">
          <AvatarImage src={avatar} />
          <AvatarFallback>{username}</AvatarFallback>
        </Avatar>
        <div className="w-full overflow-hidden">
          <div className="text-sm font-semibold truncate">{username}</div>
          {event && (
            <div className="text-xs text-muted-foreground">{formatTimestamp(event.created_at)}</div>
          )}
        </div>
      </div>
      {event && (
        <Content className="mt-2 text-sm text-wrap break-words whitespace-pre-wrap" event={event} />
      )}
    </Card>
  )
}
