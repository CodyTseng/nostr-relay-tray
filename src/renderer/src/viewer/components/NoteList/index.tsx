import { Event, Filter } from '@nostr-relay/common'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { useEffect, useState } from 'react'
import NoteCard from '../NoteCard'

export default function NoteList({ filter = {} }: { filter?: Filter }) {
  const [events, setEvents] = useState<Event[]>([])
  const init = async () => {
    const events = await window.api.relay.findEvents({ ...filter, limit: 500 })
    setEvents((oldEvents) => [
      ...oldEvents,
      ...events.filter((event) => !event.tags.some(([tagName]) => tagName === 'e'))
    ])
  }

  useEffect(() => {
    init()
  }, [])

  return (
    <ScrollArea className="pr-4 w-full h-full">
      {events.map((event, i) => (
        <NoteCard key={i} className="mb-4 w-full" event={event} />
      ))}
    </ScrollArea>
  )
}
