import { Event } from '@nostr-relay/common'
import { Card } from '@renderer/components/ui/card'
import { toNote } from '@renderer/lib/url'
import { useNavigate } from 'react-router-dom'
import Note from '../Note'

export default function ShortTextNoteCard({
  event,
  className
}: {
  event: Event
  className?: string
}) {
  const navigate = useNavigate()

  return (
    <div
      className={className}
      onClick={(e) => {
        e.stopPropagation()
        navigate(toNote(event.id))
      }}
    >
      <Card className="p-4 hover:bg-muted/50 text-left cursor-pointer">
        <Note event={event} />
      </Card>
    </div>
  )
}
