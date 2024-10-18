import { Event, Filter } from '@nostr-relay/common'
import { useEffect, useState } from 'react'

export default function useFetchEvent(filter: Filter) {
  const [event, setEvent] = useState<Event | null>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      const events = await window.api.relay.findEvents({ ...filter, limit: 1 })
      if (events.length) {
        setEvent(events[0])
      } else {
        setEvent(null)
      }
    }

    fetchEvent()
  }, [filter])

  return event
}
