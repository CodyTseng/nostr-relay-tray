import NoteList from '@renderer/viewer/components/NoteList'

export default function Notes() {
  return <NoteList filter={{ kinds: [1] }} />
}
