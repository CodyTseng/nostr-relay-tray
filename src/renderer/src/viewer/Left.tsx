import { ScrollArea } from '@renderer/components/ui/scroll-area'
import NoteListPage from './pages/NoteListPage'

export default function Left() {
  return (
    <>
      <ScrollArea className="px-4 h-full" scrollBarClassName="pt-9">
        <div className="pt-14">
          <NoteListPage />
        </div>
      </ScrollArea>
    </>
  )
}
