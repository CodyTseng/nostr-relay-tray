import { Event } from '@nostr-relay/common'
import { Avatar, AvatarFallback, AvatarImage } from '@renderer/components/ui/avatar'
import { Card } from '@renderer/components/ui/card'
import { formatPubkey } from '@renderer/lib/pubkey'
import { formatTimestamp } from '@renderer/lib/timestamp'
import { parseContent } from '@renderer/pages/feed/components/Content'
import { useEffect, useState } from 'react'

export default function Note({ event, canClick = true }: { event: Event; canClick?: boolean }) {
  const [username, setUsername] = useState<string>(formatPubkey(event.pubkey))
  const [avatar, setAvatar] = useState<string>('')

  const { contentElement, images } = parseContent(event.content)

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
    <Card className={`p-4 mb-4 ${canClick ? 'hover:bg-muted' : ''}`}>
      <div className="flex items-center space-x-2">
        <Avatar className="w-9 h-9">
          <AvatarImage src={avatar} />
          <AvatarFallback>{username}</AvatarFallback>
        </Avatar>
        <div className="w-full overflow-hidden">
          <div className="text-sm font-semibold truncate">{username}</div>
          <div className="text-xs text-muted-foreground">{formatTimestamp(event.created_at)}</div>
        </div>
      </div>
      <div className="mt-2 text-sm text-wrap break-words whitespace-pre-wrap">{contentElement}</div>
      <div className="flex mt-2 gap-2">
        {images.map((url) => (
          <img key={url} src={url} className="w-64 object-cover" />
        ))}
      </div>
    </Card>
  )
}
