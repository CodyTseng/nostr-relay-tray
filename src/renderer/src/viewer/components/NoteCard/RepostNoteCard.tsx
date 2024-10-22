import { Event } from '@nostr-relay/common'
import { useFetchEventById, useFetchProfile } from '@renderer/viewer/hooks'
import { Repeat2 } from 'lucide-react'
import Username from '../Username'
import ShortTextNoteCard from './ShortTextNoteCard'

export default function RepostNoteCard({ event, className }: { event: Event; className?: string }) {
  const { username } = useFetchProfile(event.pubkey)
  const targetEventId = event.tags.find(([tagName]) => tagName === 'e')?.[1]
  const targetEvent = targetEventId ? useFetchEventById(targetEventId) : null
  if (!targetEvent) return null

  return (
    <div className={className}>
      <div className="flex gap-1 mb-1 pl-4 text-sm items-center">
        <Repeat2 size={16} />
        <Username userId={event.pubkey} username={username} />
        <div>reposted</div>
      </div>
      <ShortTextNoteCard event={targetEvent} />
    </div>
  )
}
