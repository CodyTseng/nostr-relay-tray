import { Event, Filter } from '@nostr-relay/common'
import { useEffect, useState } from 'react'
import NoteCard from '../NoteCard'

export default function NoteList({ filter = {} }: { filter?: Filter }) {
  const [events, setEvents] = useState<Event[]>([])
  const init = async () => {
    const events = await window.api.relay.findEvents({ ...filter, limit: 100 })
    setEvents((oldEvents) => [
      ...oldEvents,
      ...events.filter((event) => !event.tags.some(([tagName]) => tagName === 'e'))
    ])
  }

  useEffect(() => {
    init()
  }, [])

  return (
    <>
      {events.map((event, i) => (
        <NoteCard key={i} className="mb-4 w-full" event={event} />
      ))}
    </>
  )
}
