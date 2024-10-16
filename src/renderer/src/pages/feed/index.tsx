import { Event } from '@nostr-relay/common'
import { useEffect, useState } from 'react'
import Note from './components/Note'
import { ScrollArea } from '@renderer/components/ui/scroll-area'

export default function Feed() {
  const [events, setEvents] = useState<Event[]>([])
  const init = async () => {
    const events = await window.api.relay.findEvents({ kinds: [1], limit: 100 })
    setEvents((oldEvents) => [...oldEvents, ...events])
  }

  useEffect(() => {
    init()
  }, [])

  return (
    <ScrollArea className="pr-4 w-full h-full">
      {events.map((event) => (
        <Note key={event.id} event={event} />
      ))}
    </ScrollArea>
  )
}
