import { CONFIG_KEY } from '@common/config'
import { THEME, TRAY_IMAGE_COLOR, TTheme, TTrayImageColor } from '@common/constants'
import { Input } from '@renderer/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Switch } from '@renderer/components/ui/switch'
import React, { useEffect, useState } from 'react'

export default function Settings(): JSX.Element {
  const [theme, setTheme] = useState<TTheme>(THEME.SYSTEM)
  const [isAutoLaunchEnabled, setIsAutoLaunchEnabled] = useState(false)
  const [isSetAutoLaunchFailed, setIsSetAutoLaunchFailed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [maxPayload, setMaxPayload] = useState(0)
  const [maxPayloadInputValueError, setMaxPayloadInputValueError] = useState<boolean>(false)
  const [trayImageColor, setTrayImageColor] = useState<TTrayImageColor>(TRAY_IMAGE_COLOR.BLACK)

  async function handleThemeChange(newTheme: TTheme) {
    await window.api.config.set(CONFIG_KEY.THEME, newTheme)
    setTheme(newTheme)
  }

  async function handleAutoLaunchToggle() {
    setIsLoading(true)
    const newEnabled = !isAutoLaunchEnabled
    const success = await window.api.setAutoLaunchEnabled(!isAutoLaunchEnabled)
    setIsLoading(false)
    setIsSetAutoLaunchFailed(!success)
    if (success) {
      setIsAutoLaunchEnabled(newEnabled)
    }
  }

  function handleMaxPayloadInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newValue = event.target.value
    if (/^\d*$/.test(newValue)) {
      setMaxPayloadInputValueError(false)
      const num = parseInt(newValue)
      setMaxPayload(isNaN(num) ? 0 : num)
    }
  }

  async function handleMaxPayloadInputBlur() {
    if (maxPayload < 1) {
      setMaxPayloadInputValueError(true)
      return
    }
    await window.api.config.set(CONFIG_KEY.WSS_MAX_PAYLOAD, maxPayload.toString())
  }

  async function handleTrayImageColorChange(value: TTrayImageColor) {
    await window.api.config.set(CONFIG_KEY.TRAY_IMAGE_COLOR, value)
    setTrayImageColor(value)
  }

  async function init() {
    const enabled = await window.api.isAutoLaunchEnabled()
    setIsAutoLaunchEnabled(enabled)

    const maxPayload = await window.api.config.get(CONFIG_KEY.WSS_MAX_PAYLOAD)
    setMaxPayload(maxPayload)

    const theme = await window.api.config.get(CONFIG_KEY.THEME)
    setTheme(theme ?? THEME.SYSTEM)
  }

  useEffect(() => {
    init()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div>Start at login</div>
          {isSetAutoLaunchFailed ? (
            <p className="text-sm text-destructive">No permission</p>
          ) : (
            <p className="text-sm text-muted-foreground">Automatically start on system startup</p>
          )}
        </div>
        <Switch
          checked={isAutoLaunchEnabled}
          onClick={handleAutoLaunchToggle}
          disabled={isLoading}
        />
      </div>
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
      <div className="flex justify-between items-center">
        <div>
          <div>Max Payload</div>
          <div className="text-sm text-muted-foreground">
            Maximum payload size for WebSocket messages
          </div>
        </div>
        <div className="flex items-center gap-2 w-48">
          <Input
            className={`w-full text-right ${!maxPayloadInputValueError ? '' : 'border-destructive'}`}
            value={`${maxPayload}`}
            onChange={handleMaxPayloadInputChange}
            onBlur={handleMaxPayloadInputBlur}
          />
          <div>KB</div>
        </div>
      </div>
      {window.electron.process.platform !== 'darwin' ? (
        <div className="flex justify-between items-center">
          <div>
            <div>Tray icon color</div>
            <div className="text-sm text-muted-foreground">
              Customize the color of the tray icon
            </div>
          </div>
          <Select value={trayImageColor} onValueChange={handleTrayImageColorChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tray Image Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TRAY_IMAGE_COLOR.BLACK}>Black</SelectItem>
              <SelectItem value={TRAY_IMAGE_COLOR.WHITE}>White</SelectItem>
              <SelectItem value={TRAY_IMAGE_COLOR.PURPLE}>Purple</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  )
}
