import { ArrowLeft, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Titlebar, TitlebarButton } from '../components/Titlebar'

export default function RightTitlebar(): JSX.Element {
  const navigate = useNavigate()

  return (
    <Titlebar className="pl-1">
      <TitlebarButton onClick={() => navigate(-1)}>
        <ArrowLeft className="text-foreground" size={15} />
      </TitlebarButton>
      <TitlebarButton onClick={() => navigate('/')}>
        <X className="text-foreground" size={15} />
      </TitlebarButton>
    </Titlebar>
  )
}
