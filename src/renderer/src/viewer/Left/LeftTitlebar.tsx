import { TestTube } from 'lucide-react'
import { Titlebar, TitlebarButton } from '../components/Titlebar'
import { useNavigate } from 'react-router-dom'
import { isMacOS } from '@renderer/lib/platform'

export default function LeftTitlebar() {
  const navigate = useNavigate()
  return (
    <Titlebar className={isMacOS() ? 'pl-20' : ''}>
      <TitlebarButton onClick={() => navigate('/')}>
        <TestTube className="text-foreground" />
      </TitlebarButton>
    </Titlebar>
  )
}
