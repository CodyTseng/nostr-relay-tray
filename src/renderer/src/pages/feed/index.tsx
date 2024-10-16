import { Event } from '@nostr-relay/common'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { useEffect, useState } from 'react'
import NoteDetail from './components/NoteDetail'

export default function Feed() {
  const [events, setEvents] = useState<Event[]>([])
  const init = async () => {
    const events = await window.api.relay.findEvents({ kinds: [1], limit: 500 })
    // const events = await window.api.relay.findEvents({
    //   ids: ['d9d3a9b54d37535fa183439f6263f30172c62f0d59d3297ed3fedbc013c07e9a']
    // })
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
      {events.map((event) => (
        <NoteDetail key={event.id} className="w-full text-left" event={event} />
      ))}
    </ScrollArea>
  )
}
