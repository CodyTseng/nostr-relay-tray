import NoteList from '@renderer/viewer/components/NoteList'
import { useParams } from 'react-router-dom'

export default function HashtagPage() {
  const params = useParams<{ id: string }>()

  const hashtag = params.id
  if (!hashtag) {
    return <div className="text-lg font-semibold">#</div>
  }

  return (
    <>
      <div className="text-lg font-semibold mb-4">#{hashtag}</div>
      <NoteList key={params.id} filter={{ '#t': [params.id] }} />
    </>
  )
}
