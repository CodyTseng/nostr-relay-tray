import { Event } from '@nostr-relay/common'
import { Separator } from '@renderer/components/ui/separator'
import CommentList from '@renderer/viewer/components/CommentList'
import Note from '@renderer/viewer/components/Note'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function NotePage() {
  const params = useParams<{ id: string }>()
  const [event, setEvent] = useState<Event | null>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      if (!params.id) return
      const events = await window.api.relay.findEvents({ ids: [params.id], limit: 1 })
      if (events.length) {
        setEvent(events[0])
      }
    }

    fetchEvent()
  }, [params.id])

  return (
    <div>
      {event && (
        <>
          <Note event={event} />
          <Separator className="my-4" />
          <CommentList key={event.id} className="pl-4" event={event} />
        </>
      )}
    </div>
  )
}
