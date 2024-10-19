import { Separator } from '@renderer/components/ui/separator'
import CommentList from '@renderer/viewer/components/CommentList'
import Note from '@renderer/viewer/components/Note'
import { useFetchEventById } from '@renderer/viewer/hooks'
import { useParams } from 'react-router-dom'

export default function NotePage() {
  const params = useParams<{ id: string }>()
  const event = params.id ? useFetchEventById(params.id) : null

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
