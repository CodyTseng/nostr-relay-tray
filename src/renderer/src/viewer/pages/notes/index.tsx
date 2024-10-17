import { ScrollArea } from '@renderer/components/ui/scroll-area'
import NoteList from '@renderer/viewer/components/NoteList'

export default function Notes() {
  return (
    <ScrollArea className="pr-4 w-full h-full">
      <NoteList filter={{ kinds: [1] }} />
    </ScrollArea>
  )
}
