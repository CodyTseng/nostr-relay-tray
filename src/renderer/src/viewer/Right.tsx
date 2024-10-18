import { Button } from '@renderer/components/ui/button'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { ArrowLeft, X } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import Titlebar from './components/Titlebar'

export default function Right() {
  const navigate = useNavigate()

  return (
    <>
      <Titlebar>
        <div className="h-full flex items-center px-2">
          <Button variant="ghost" className="h-7 w-7 p-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="text-foreground" size={15} />
          </Button>
          <Button variant="ghost" className="h-7 w-7 p-0" onClick={() => navigate('/')}>
            <X className="text-foreground" size={15} />
          </Button>
        </div>
      </Titlebar>
      <ScrollArea className="px-4 h-full" scrollBarClassName="pt-9">
        <div className="pt-14">
          <Outlet />
        </div>
      </ScrollArea>
    </>
  )
}
