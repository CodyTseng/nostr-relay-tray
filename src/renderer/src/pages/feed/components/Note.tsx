import { Avatar, AvatarFallback, AvatarImage } from '@renderer/components/ui/avatar'
import { Card } from '@renderer/components/ui/card'
import dayjs from 'dayjs'
import { Event, nip19 } from 'nostr-tools'
import { useEffect, useState } from 'react'

export default function Note({ event }: { event: Event }) {
  const [username, setUsername] = useState<string>(formatPubkey(event.pubkey))
  const [avatar, setAvatar] = useState<string>('')

  const init = async () => {
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
    <Card className="p-4 mb-4 hover:bg-muted">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={avatar} />
            <AvatarFallback>{username}</AvatarFallback>
          </Avatar>
          <div className="text-sm font-semibold truncate max-w-xs">{username}</div>
        </div>
        <div className="text-xs text-muted-foreground">{formatTimestamp(event.created_at)}</div>
      </div>
      <div className="mt-2 text-sm text-wrap break-words w-full">{event.content}</div>
    </Card>
  )
}

function formatPubkey(pubkey: string) {
  try {
    const npub = nip19.npubEncode(pubkey)
    return npub.slice(0, 8) + '...' + npub.slice(-4)
  } catch {
    return pubkey.slice(0, 4) + '...' + pubkey.slice(-4)
  }
}

function formatTimestamp(timestamp: number) {
  const time = dayjs(timestamp * 1000)
  const now = dayjs()
  const diff = now.diff(time, 'day')
  if (diff > 1) {
    return `${diff} days ago`
  }

  const diffHour = now.diff(time, 'hour')
  if (diffHour > 1) {
    return `${diffHour} hours ago`
  }

  const diffMinute = now.diff(time, 'minute')
  if (diffMinute > 1) {
    return `${diffMinute} minutes ago`
  }

  return 'just now'
}
