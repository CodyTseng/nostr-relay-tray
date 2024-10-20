import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { isMacOS } from '@renderer/lib/platform'
import NoteListPage from '../pages/NoteListPage'
import LeftTitlebar from './LeftTitlebar'

export default function Left() {
  return (
    <>
      <ScrollArea className="h-full">
        <LeftTitlebar />
        <div className={isMacOS() ? 'px-4 pt-10 pb-4' : 'p-4'}>
          <NoteListPage />
        </div>
      </ScrollArea>
    </>
  )
}
