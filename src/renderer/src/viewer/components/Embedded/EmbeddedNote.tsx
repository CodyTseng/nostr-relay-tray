import { useFetchEventById } from '@renderer/viewer/hooks'
import { Link } from 'react-router-dom'
import NoteCard from '../NoteCard'

export function EmbeddedNote({ id }: { id: string }) {
  const event = useFetchEventById(id)

  return event ? (
    <NoteCard className="mt-2 w-full" event={event} />
  ) : (
    <Link
      to={`https://nostrudel.ninja/#/n/${id}`}
      target="_blank"
      className="text-highlight hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {id}
    </Link>
  )
}
