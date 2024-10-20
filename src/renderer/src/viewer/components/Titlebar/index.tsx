import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'

export function Titlebar({
  children,
  className
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className="sticky top-0 h-9 z-10 w-full">
      <div
        className={cn(
          'draggable absolute w-full h-full bg-background/50 backdrop-blur-md flex items-center',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function TitlebarButton({
  onClick,
  children
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button variant="ghost" className="h-7 w-7 p-1 rounded-lg" onClick={onClick}>
      {children}
    </Button>
  )
}
