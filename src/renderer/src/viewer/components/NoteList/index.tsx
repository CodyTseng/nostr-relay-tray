import { Event, Filter } from '@nostr-relay/common'
import { useEffect, useState } from 'react'
import NoteCard from '../NoteCard'
import { cn } from '@renderer/lib/utils'

export default function NoteList({
  filter = {},
  className
}: {
  filter?: Filter
  className?: string
}) {
  const [events, setEvents] = useState<Event[]>([])
  const init = async () => {
    const events = await window.api.relay.findEvents({ kinds: [1], ...filter, limit: 200 })
    setEvents((oldEvents) => [
      ...oldEvents,
      ...events.filter((event) => !event.tags.some(([tagName]) => tagName === 'e'))
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
