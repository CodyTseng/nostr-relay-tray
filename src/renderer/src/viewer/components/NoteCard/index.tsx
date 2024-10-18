import { Event } from '@nostr-relay/common'
import { Card } from '@renderer/components/ui/card'
import { Link } from 'react-router-dom'
import Note from '../Note'

export default function NoteCard({ event, className }: { event: Event; className?: string }) {
  return (
    <Link to={`/note/${event.id}`}>
      <div className={className}>
        <Card className="p-4 hover:bg-muted/50 text-left">
          <Note event={event} />
        </Card>
      </div>
    </Link>
  )
}
