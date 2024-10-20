import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { isMacOS } from '@renderer/lib/platform'
import { Outlet } from 'react-router-dom'
import RightTitlebar from './RightTitlebar'

export default function Right() {
  return (
    <>
      <ScrollArea className="h-full" scrollBarClassName={isMacOS() ? 'pt-10' : 'pt-4'}>
        <RightTitlebar />
        <div className="px-4 pb-4 pt-[52px]">
          <Outlet />
        </div>
      </ScrollArea>
    </>
  )
}
