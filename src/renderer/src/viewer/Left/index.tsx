import { ScrollArea } from '@renderer/components/ui/scroll-area'
import NoteListPage from '../pages/NoteListPage'
import LeftTitlebar from './LeftTitlebar'
import { isMacOS } from '@renderer/lib/platform'

export default function Left() {
  return (
    <>
      <ScrollArea className="h-full">
        <LeftTitlebar />
        <div className={isMacOS() ? 'px-4 pt-10' : 'p-4'}>
          <NoteListPage />
        </div>
      </ScrollArea>
    </>
  )
}
