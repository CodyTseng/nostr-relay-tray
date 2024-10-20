import { useFetchEventById } from '@renderer/viewer/hooks'
import { toNoStrudelNote } from '@renderer/viewer/lib/url'
import { Link } from 'react-router-dom'
import NoteCard from '../NoteCard'

export function EmbeddedNote({ noteId }: { noteId: string }) {
  const event = useFetchEventById(noteId)

  return event ? (
    <NoteCard className="mt-2 w-full" event={event} />
  ) : (
    <Link
      to={toNoStrudelNote(noteId)}
      target="_blank"
      className="text-highlight hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {noteId}
    </Link>
  )
}
