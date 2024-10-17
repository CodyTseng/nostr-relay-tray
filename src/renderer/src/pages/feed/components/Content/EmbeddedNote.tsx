import { Event } from '@nostr-relay/common'
import { nip19 } from 'nostr-tools'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Note from '../Note'

function EmbeddedNote({ id }: { id: string }) {
  const [event, setEvent] = useState<Event | null>(null)

  const note1 = id.split(':')[1] as `note1:${string}`

  const init = async () => {
    try {
      const { data } = nip19.decode(note1)
      const events = await window.api.relay.findEvents({
        ids: [data]
      })
      setEvent(events[0])
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    init()
  }, [])

  return event ? (
    <Note event={event} />
  ) : (
    <Link
      to={`https://nostrudel.ninja/#/n/${note1}`}
      target="_blank"
      className="text-blue-500 hover:underline"
    >
      {id}
    </Link>
  )
}

export default function renderEmbeddedNote(id: string, index: number) {
  return <EmbeddedNote key={`embedded-note-${index}`} id={id} />
}
