import { CONFIG_KEY } from '@common/config'
import { DEFAULT_HUB_URL, HUB_CONNECTION_STATUS, THubConnectionStatus } from '@common/constants'
import { Badge } from '@renderer/components/ui/badge'
import { Input } from '@renderer/components/ui/input'
import { Switch } from '@renderer/components/ui/switch'
import { useToast } from '@renderer/components/ui/use-toast'
import { ChangeEvent, useEffect, useState } from 'react'

export default function JoinTrayHubOption() {
  const { toast } = useToast()
  const [isJoinTrayHubEnabled, setIsJoinTrayHubEnabled] = useState(false)
  const [trayHubUrl, setTrayHubUrl] = useState(DEFAULT_HUB_URL)
  const [trayHubConnectionStatus, setTrayHubConnectionStatus] = useState<THubConnectionStatus>(
    HUB_CONNECTION_STATUS.DISCONNECTED
  )
  const [isJoinHubSwitchLoading, setIsJoinHubSwitchLoading] = useState(false)

  const handleJoinTrayHubToggle = async () => {
    setIsJoinHubSwitchLoading(true)
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
    setIsJoinHubSwitchLoading(false)
  }

  const handleTrayHubUrlInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value
    setTrayHubUrl(url)
    await window.api.config.set(CONFIG_KEY.HUB_URL, url)
  }

  async function init() {
    const [hubUrl, hubConnectionStatus] = await Promise.all([
      window.api.config.get(CONFIG_KEY.HUB_URL),
      window.api.hub.currentStatus()
    ])

    setTrayHubUrl(hubUrl)

    const currentHubEnabled = hubConnectionStatus !== HUB_CONNECTION_STATUS.DISCONNECTED
    setIsJoinTrayHubEnabled(currentHubEnabled)
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
        <Switch
          checked={isJoinTrayHubEnabled}
          onClick={handleJoinTrayHubToggle}
          disabled={isJoinHubSwitchLoading}
        />
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
  )
}
