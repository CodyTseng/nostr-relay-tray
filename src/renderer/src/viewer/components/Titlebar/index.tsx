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
    <div
      className={cn(
        'titlebar absolute top-0 w-full h-9 z-50 bg-background/50 backdrop-blur-md flex items-center',
        className
      )}
    >
      {children}
    </div>
  )
}

export function TitlebarButton({
  onClick,
  disabled,
  children
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Button
      variant="ghost"
      className="titlebar-button h-7 w-7 p-1 rounded-lg"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  )
}
