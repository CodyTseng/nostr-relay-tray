import { Event } from '@nostr-relay/common'
import { useEffect, useState } from 'react'
import Note from './components/Note'

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
    <div className="px-2 w-full overflow-hidden">
      {events.map((event) => (
        <Note key={event.id} event={event} />
      ))}
    </div>
  )
}
