import { Button } from '@renderer/components/ui/button'
import { ArrowLeft, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Titlebar(): JSX.Element {
  const navigate = useNavigate()
  const [showButtons, setShowButtons] = useState(false)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (event.clientY < 50) {
        setShowButtons(true)
      } else {
        setShowButtons(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div className="sticky top-0 z-10 w-full pointer-events-none">
      <div
        className={`absolute top-2 left-2 transition-transform duration-300 flex items-center space-x-2 ${
          showButtons ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-100'
        }`}
      >
        <TitlebarButton onClick={() => navigate(-1)}>
          <ArrowLeft className="text-foreground" />
        </TitlebarButton>
        <TitlebarButton onClick={() => navigate('/')}>
          <X className="text-foreground" />
        </TitlebarButton>
      </div>
    </div>
  )
}

function TitlebarButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Button
      variant="outline"
      className="h-8 w-8 p-2 pointer-events-auto rounded-full"
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
