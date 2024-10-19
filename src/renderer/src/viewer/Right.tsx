import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Outlet } from 'react-router-dom'
import Titlebar from './components/Titlebar'

export default function Right() {
  return (
    <>
      <ScrollArea className="h-full">
        <Titlebar />
        <div className="p-4">
          <Outlet />
        </div>
      </ScrollArea>
    </>
  )
}
