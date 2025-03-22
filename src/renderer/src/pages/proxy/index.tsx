import { PROXY_CONNECTION_STATUS, TProxyConnectionStatus } from '@common/constants'
import { Switch } from '@renderer/components/ui/switch'
import { useToast } from '@renderer/components/ui/use-toast'
import { useEffect, useState } from 'react'
import PublicAddress from './PublicAddress'
import { cn } from '@renderer/lib/utils'

export default function Proxy(): JSX.Element {
  const { toast } = useToast()
  const [status, setStatus] = useState<TProxyConnectionStatus>(PROXY_CONNECTION_STATUS.DISCONNECTED)
  const [publicAddress, setPublicAddress] = useState<string>('')

  useEffect(() => {
    const init = async () => {
      const [currentStatus, publicAddress] = await Promise.all([
        window.api.proxy.currentStatus(),
        window.api.proxy.publicAddress()
      ])
      setStatus(currentStatus)
      setPublicAddress(publicAddress ?? '')
    }
    init()

    const listener = (_, status: TProxyConnectionStatus) => {
      setStatus(status)
    }
    window.api.proxy.onStatusChange(listener)
    return () => {
      window.api.proxy.removeStatusChange(listener)
    }
  }, [])

  const connectProxy = async () => {
    if (status === PROXY_CONNECTION_STATUS.CONNECTED) return

    try {
      const result = await window.api.proxy.connect()
      if (!result.success) {
        toast({
          description: result.errorMessage ?? 'Failed to connect to the proxy',
          variant: 'destructive'
        })
        return
      }
      setPublicAddress(result.publicAddress)
    } catch (error) {
      toast({
        description: (error as Error).message,
        variant: 'destructive'
      })
    }
  }

  const disconnectProxy = async () => {
    await window.api.proxy.disconnect()
    setPublicAddress('')
  }

  return (
    <div className="space-y-4 pr-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex gap-2 items-center">
              <div>Connect to proxy</div>
              <div
                className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  status === PROXY_CONNECTION_STATUS.CONNECTED
                    ? 'bg-green-400'
                    : status === PROXY_CONNECTION_STATUS.CONNECTING
                      ? 'bg-orange-400'
                      : 'bg-gray-400'
                )}
              />
              <div
                className={cn(
                  'text-xs',
                  status === PROXY_CONNECTION_STATUS.CONNECTED
                    ? 'text-green-400'
                    : status === PROXY_CONNECTION_STATUS.CONNECTING
                      ? 'text-orange-400'
                      : 'text-gray-400'
                )}
              >
                {status === PROXY_CONNECTION_STATUS.CONNECTED
                  ? 'Connected'
                  : status === PROXY_CONNECTION_STATUS.CONNECTING
                    ? 'Connecting...'
                    : 'Disconnected'}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Expose your local relay to the internet
            </div>
          </div>
          <Switch
            className={
              status === PROXY_CONNECTION_STATUS.CONNECTED
                ? 'data-[state=checked]:bg-green-400'
                : status === PROXY_CONNECTION_STATUS.CONNECTING
                  ? 'data-[state=checked]:bg-orange-400'
                  : ''
            }
            checked={status !== PROXY_CONNECTION_STATUS.DISCONNECTED}
            onCheckedChange={(checked) => {
              if (checked) {
                connectProxy()
              } else {
                disconnectProxy()
              }
            }}
            title={
              status === PROXY_CONNECTION_STATUS.CONNECTED
                ? 'Disconnect from proxy'
                : 'Connect to proxy'
            }
          />
        </div>
      </div>
      <PublicAddress publicAddress={publicAddress} />
    </div>
  )
}
