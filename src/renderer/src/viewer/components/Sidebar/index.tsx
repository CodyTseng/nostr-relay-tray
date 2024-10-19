import { Button } from '@renderer/components/ui/button'
import { isMacOS } from '@renderer/lib/platform'
import { cn } from '@renderer/lib/utils'
import { Home, Settings, WifiOff } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

export default function Sidebar() {
  const navigate = useNavigate()

  return (
    <div
      className={cn(
        'draggable h-full w-20 flex-shrink-0 flex flex-col justify-between items-center border-r shadow-sm pb-4',
        isMacOS() ? 'pt-10' : 'pt-5'
      )}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="flex space-x-1 items-center text-muted-foreground">
          <WifiOff size={14} />
          <div className="text-sm">offline</div>
        </div>
        <NavLink
          to={'/profile/npub1y3rzjvyzrdzl2v8vqp37eg9x2gh954mc2muc9755fhcw7090qw4s9yyq9d'}
          className={({ isActive }) =>
            isActive ? 'text-highlight' : 'text-muted-foreground hover:text-highlight/80'
          }
        >
          <Home />
        </NavLink>
      </div>
      <Button
        variant="link"
        className="text-muted-foreground hover:text-highlight/80"
        onClick={() => window.api.window.openDashboard()}
      >
        <Settings />
      </Button>
    </div>
  )
}
