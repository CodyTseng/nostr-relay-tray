import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { isMacOS } from '@renderer/lib/platform'
import NoteListPage from '../pages/NoteListPage'
import LeftTitlebar from './LeftTitlebar'

export default function Left() {
  return (
    <>
      <ScrollArea className="h-full" scrollBarClassName={isMacOS() ? 'pt-9' : 'pt-4'}>
        <LeftTitlebar />
        <div className="p-4">
          <NoteListPage />
        </div>
      </ScrollArea>
    </>
  )
}
