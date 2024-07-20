import { CONFIG_KEY } from '@common/config'
import {
  DEFAULT_HUB_URL,
  HUB_CONNECTION_STATUS,
  THEME,
  THubConnectionStatus,
  TRAY_IMAGE_COLOR,
  TTheme,
  TTrayImageColor
} from '@common/constants'
import { Badge } from '@renderer/components/ui/badge'
import { Input } from '@renderer/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Switch } from '@renderer/components/ui/switch'
import { useToast } from '@renderer/components/ui/use-toast'
import React, { useEffect, useState } from 'react'

export default function Settings(): JSX.Element {
  const { toast } = useToast()
  const [theme, setTheme] = useState<TTheme>(THEME.SYSTEM)
  const [isAutoLaunchEnabled, setIsAutoLaunchEnabled] = useState(false)
  const [isSetAutoLaunchFailed, setIsSetAutoLaunchFailed] = useState(false)
  const [isSetAutoLaunchLoading, setIsSetAutoLaunchLoading] = useState(false)
  const [maxPayload, setMaxPayload] = useState(0)
  const [maxPayloadInputValueError, setMaxPayloadInputValueError] = useState<boolean>(false)
  const [trayImageColor, setTrayImageColor] = useState<TTrayImageColor>(TRAY_IMAGE_COLOR.BLACK)
  const [isJoinTrayHubEnabled, setIsJoinTrayHubEnabled] = useState(false)
  const [trayHubUrl, setTrayHubUrl] = useState(DEFAULT_HUB_URL)
  const [trayHubConnectionStatus, setTrayHubConnectionStatus] = useState<THubConnectionStatus>(
    HUB_CONNECTION_STATUS.DISCONNECTED
  )

  async function handleThemeChange(newTheme: TTheme) {
    await window.api.config.set(CONFIG_KEY.THEME, newTheme)
    setTheme(newTheme)
  }

  async function handleAutoLaunchToggle() {
    setIsSetAutoLaunchLoading(true)
    const newEnabled = !isAutoLaunchEnabled
    const success = await window.api.setAutoLaunchEnabled(!isAutoLaunchEnabled)
    setIsSetAutoLaunchLoading(false)
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

  async function handleJoinTrayHubToggle() {
    const newEnabled = !isJoinTrayHubEnabled
    setIsJoinTrayHubEnabled(newEnabled)
    if (newEnabled) {
      const { success, errorMessage } = await window.api.hub.connect(trayHubUrl)
      if (!success) {
        toast({
          description:
            errorMessage ?? 'Failed to connect to the hub, please check the URL and try again',
          variant: 'destructive'
        })
        setIsJoinTrayHubEnabled(false)
      }
    } else {
      await window.api.hub.disconnect()
    }
  }

  async function handleTrayHubUrlInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const url = event.target.value
    setTrayHubUrl(url)
    await window.api.config.set(CONFIG_KEY.HUB_URL, url)
  }

  async function init() {
    const [enabled, maxPayload, theme, hubEnabled, hubUrl, hubConnectionStatus] = await Promise.all(
      [
        window.api.isAutoLaunchEnabled(),
        window.api.config.get(CONFIG_KEY.WSS_MAX_PAYLOAD),
        window.api.config.get(CONFIG_KEY.THEME),
        window.api.config.get(CONFIG_KEY.HUB_ENABLED),
        window.api.config.get(CONFIG_KEY.HUB_URL),
        window.api.hub.currentStatus()
      ]
    )

    setIsAutoLaunchEnabled(enabled)
    setMaxPayload(maxPayload)
    setTheme(theme ?? THEME.SYSTEM)
    setIsJoinTrayHubEnabled(hubEnabled)
    setTrayHubUrl(hubUrl)
    setTrayHubConnectionStatus(hubConnectionStatus)

    window.api.hub.onStatusChange((status) => {
      setTrayHubConnectionStatus(status)
      if (status === HUB_CONNECTION_STATUS.DISCONNECTED) {
        setIsJoinTrayHubEnabled(false)
      } else {
        setIsJoinTrayHubEnabled(true)
      }
    })
  }

  useEffect(() => {
    init()
  }, [])

  return (
    <div className="space-y-8">
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
          disabled={isSetAutoLaunchLoading}
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
          <div>Max payload</div>
          <div className="text-sm text-muted-foreground">
            Maximum payload size for WebSocket messages
          </div>
        </div>
        <div className="flex items-center gap-2 w-52">
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
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge>Beta</Badge>
            <div>Join tray hub</div>
            <div className="flex gap-1 items-center">
              <span
                className={`ml-2 mr-1 rounded-full w-2 h-2 ${
                  trayHubConnectionStatus === HUB_CONNECTION_STATUS.CONNECTED
                    ? 'bg-green-500'
                    : trayHubConnectionStatus === HUB_CONNECTION_STATUS.CONNECTING
                      ? 'bg-yellow-500'
                      : 'bg-muted-foreground'
                }`}
              />
              <div className="text-sm text-muted-foreground">{trayHubConnectionStatus}</div>
            </div>
          </div>
          <Switch checked={isJoinTrayHubEnabled} onClick={handleJoinTrayHubToggle} />
        </div>
        <div className="flex gap-2 items-center">
          <Input
            disabled={isJoinTrayHubEnabled}
            value={trayHubUrl}
            onChange={handleTrayHubUrlInputChange}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Join the tray hub to share your events. (The URL is NOT a regular relay URL)
        </div>
      </div>
    </div>
  )
}
