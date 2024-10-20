import { Event, Filter } from '@nostr-relay/common'
import { cn } from '@renderer/lib/utils'
import { useEffect, useState } from 'react'
import NoteCard from '../NoteCard'
import { kinds } from 'nostr-tools'

export default function NoteList({
  filter = {},
  className
}: {
  filter?: Filter
  className?: string
}) {
  const [events, setEvents] = useState<Event[]>([])
  const init = async () => {
    const events = await window.api.relay.findEvents({ kinds: [1, 6], limit: 100, ...filter })
    setEvents((oldEvents) => [
      ...oldEvents,
      ...events.filter(
        (e) => !(e.kind === kinds.ShortTextNote && e.tags.some(([tagName]) => tagName === 'e'))
      )
    ])
  }

  useEffect(() => {
    init()
  }, [])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {events.map((event, i) => (
        <NoteCard key={i} className="w-full" event={event} />
      ))}
    </div>
  )
}
