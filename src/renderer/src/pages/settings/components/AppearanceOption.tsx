import { CONFIG_KEY } from '@common/config'
import { THEME, TTheme } from '@common/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { useEffect, useState } from 'react'

export default function AppearanceOption() {
  const [theme, setTheme] = useState<TTheme>(THEME.SYSTEM)

  const init = async () => {
    const currentTheme = await window.api.config.get(CONFIG_KEY.THEME)
    setTheme(currentTheme)
  }

  useEffect(() => {
    init()
  }, [])

  const handleThemeChange = async (newTheme: TTheme) => {
    await window.api.config.set(CONFIG_KEY.THEME, newTheme)
    setTheme(newTheme)
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <div>Appearance</div>
        <div className="text-sm text-muted-foreground">Customize the look of the app</div>
      </div>
      <Select value={theme} onValueChange={handleThemeChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
          <SelectItem value="system">System</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
