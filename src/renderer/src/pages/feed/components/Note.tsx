import { Avatar, AvatarFallback, AvatarImage } from '@renderer/components/ui/avatar'
import { Card } from '@renderer/components/ui/card'
import dayjs from 'dayjs'
import { Event } from 'nostr-tools'
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
          <div className="text-sm font-semibold">{username}</div>
        </div>
        <div className="text-xs text-muted-foreground">{formatTimestamp(event.created_at)}</div>
      </div>
      <div className="mt-2 text-sm text-pretty break-words  w-full overflow-hidden">
        {event.content}
      </div>
    </Card>
  )
}

function formatPubkey(pubkey: string) {
  return pubkey.slice(0, 4) + '...' + pubkey.slice(-4)
}

function formatTimestamp(timestamp: number) {
  return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss')
}
