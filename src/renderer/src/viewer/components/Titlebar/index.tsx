import { Button } from '@renderer/components/ui/button'
import { ArrowLeft, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Titlebar(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const [canBack, setCanBack] = useState(false)

  useEffect(() => {
    setCanBack(location.pathname !== '/')
  }, [location])

  return (
    <div className="titlebar fixed top-0 h-9 z-10 w-full bg-background/50 backdrop-blur-sm drop-shadow-sm">
      {canBack && (
        <div className="h-full flex items-center px-2 justify-end">
          <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="text-foreground" size={15} />
          </Button>
          <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => navigate('/')}>
            <X className="text-foreground" size={15} />
          </Button>
        </div>
      )}
    </div>
  )
}
