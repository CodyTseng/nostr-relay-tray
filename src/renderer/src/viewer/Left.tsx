import { ScrollArea } from '@renderer/components/ui/scroll-area'
import NoteListPage from './pages/NoteListPage'

export default function Left() {
  return (
    <>
      <ScrollArea className="h-full">
        <div className="p-4">
          <NoteListPage />
        </div>
      </ScrollArea>
    </>
  )
}
