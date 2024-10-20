import { Event } from '@nostr-relay/common'
import { Avatar, AvatarImage } from '@renderer/components/ui/avatar'
import { useFetchEventById, useFetchProfile } from '@renderer/viewer/hooks'
import { toProfile } from '@renderer/viewer/lib/url'
import { useNavigate } from 'react-router-dom'
import ShortTextNoteCard from './ShortTextNoteCard'

export default function RepostNoteCard({ event, className }: { event: Event; className?: string }) {
  const navigate = useNavigate()
  const { avatar = '', username } = useFetchProfile(event.pubkey)
  const targetEventId = event.tags.find(([tagName]) => tagName === 'e')?.[1]
  const targetEvent = targetEventId ? useFetchEventById(targetEventId) : null
  if (!targetEvent) return null

  return (
    <div className={className}>
      <div className="flex gap-2 pl-4 mb-1 text-sm items-center">
        <div
          className="flex gap-2 cursor-pointer items-center"
          onClick={() => navigate(toProfile(event.pubkey))}
        >
          <Avatar className="w-6 h-6">
            <AvatarImage src={avatar} />
          </Avatar>
          <div
            className="hover:underline font-semibold"
            onClick={() => navigate(toProfile(event.pubkey))}
          >
            {username}
          </div>
        </div>
        <div>Repost</div>
      </div>
      <ShortTextNoteCard event={targetEvent} />
    </div>
  )
}
