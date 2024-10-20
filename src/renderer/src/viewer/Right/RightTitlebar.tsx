import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Titlebar, TitlebarButton } from '../components/Titlebar'

export default function RightTitlebar(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const [canBack, setCanBack] = useState(false)

  useEffect(() => {
    setCanBack(location.pathname !== '/')
  }, [location])

  return (
    <Titlebar className="pl-1">
      <TitlebarButton onClick={() => navigate(-1)} disabled={!canBack}>
        <ArrowLeft className="text-foreground" />
      </TitlebarButton>
    </Titlebar>
  )
}
