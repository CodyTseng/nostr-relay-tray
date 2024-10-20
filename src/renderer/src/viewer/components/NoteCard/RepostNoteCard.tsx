import { Event } from '@nostr-relay/common'
import { useFetchEventById, useFetchProfile } from '@renderer/viewer/hooks'
import ProfileAvatarLink from '../ProfileAvatarLink'
import ProfileTextLink from '../ProfileTextLink'
import ShortTextNoteCard from './ShortTextNoteCard'

export default function RepostNoteCard({ event, className }: { event: Event; className?: string }) {
  const { avatar = '', username } = useFetchProfile(event.pubkey)
  const targetEventId = event.tags.find(([tagName]) => tagName === 'e')?.[1]
  const targetEvent = targetEventId ? useFetchEventById(targetEventId) : null
  if (!targetEvent) return null

  return (
    <div className={className}>
      <div className="flex gap-2 pl-4 mb-1 text-sm items-center">
        <ProfileAvatarLink avatar={avatar} userId={event.pubkey} className="w-6 h-6" />
        <ProfileTextLink userId={event.pubkey}>{username}</ProfileTextLink>
        <div>Repost</div>
      </div>
      <ShortTextNoteCard event={targetEvent} />
    </div>
  )
}
