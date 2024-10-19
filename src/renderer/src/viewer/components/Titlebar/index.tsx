import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { useEffect, useState } from 'react'

export function Titlebar({
  children,
  className
}: {
  children?: React.ReactNode
  className?: string
}) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (event.clientY < 50) {
        setShow(true)
      } else {
        setShow(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div className="sticky top-0 z-10 w-full">
      <div
        className={cn(
          'draggable absolute w-full h-9 bg-background/50 backdrop-blur-md transition-transform duration-500 flex items-center',
          show ? 'translate-y-0' : '-translate-y-10',
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
    <Button variant="ghost" className="h-7 w-7 p-0 rounded-lg" onClick={onClick}>
      {children}
    </Button>
  )
}
