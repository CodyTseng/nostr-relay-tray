import { Event } from '@nostr-relay/common'
import { Card } from '@renderer/components/ui/card'
import { toNote } from '@renderer/viewer/lib/url'
import { useNavigate } from 'react-router-dom'
import Note from '../Note'

export default function NoteCard({ event, className }: { event: Event; className?: string }) {
  const navigate = useNavigate()

  return (
    <div className={className} onClick={() => navigate(toNote(event.id))}>
      <Card className="p-4 hover:bg-muted/50 text-left">
        <Note event={event} />
      </Card>
    </div>
  )
}
