import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Outlet } from 'react-router-dom'

export default function Right() {
  return (
    <>
      <ScrollArea className="px-4 h-full" scrollBarClassName="pt-9">
        <div className="pt-14">
          <Outlet />
        </div>
      </ScrollArea>
    </>
  )
}
