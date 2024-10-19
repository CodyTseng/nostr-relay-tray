import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Outlet } from 'react-router-dom'
import RightTitlebar from './RightTitlebar'
import { isMacOS } from '@renderer/lib/platform'

export default function Right() {
  return (
    <>
      <ScrollArea className="h-full">
        <RightTitlebar />
        <div className={isMacOS() ? 'px-4 pt-10' : 'p-4'}>
          <Outlet />
        </div>
      </ScrollArea>
    </>
  )
}
