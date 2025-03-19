import { PROXY_CONNECTION_STATUS, TProxyConnectionStatus } from '@common/constants'
import { Button } from '@renderer/components/ui/button'
import { useToast } from '@renderer/components/ui/use-toast'
import { useEffect, useState } from 'react'
import PublicAddress from './PublicAddress'

export default function Proxy(): JSX.Element {
  const { toast } = useToast()
  const [status, setStatus] = useState<TProxyConnectionStatus>(PROXY_CONNECTION_STATUS.DISCONNECTED)
  const [publicAddress, setPublicAddress] = useState<string>('')
  const [hover, setHover] = useState(false)

  useEffect(() => {
    const init = async () => {
      const [currentStatus, publicAddress] = await Promise.all([
        window.api.proxy.currentStatus(),
        window.api.proxy.publicAddress()
      ])
      setStatus(currentStatus)
      setPublicAddress(publicAddress ?? '')

      window.api.proxy.onStatusChange((status: TProxyConnectionStatus) => {
        setStatus(status)
      })
    }
    init()
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div>Connect to proxy</div>
          <div className="text-sm text-muted-foreground">
            Expose your local relay to the internet
          </div>
        </div>
        {status === 'disconnected' ? (
          <Button
            className="w-32"
            onClick={() => connectProxy()}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            Connect
          </Button>
        ) : status === 'connecting' ? (
          <Button
            disabled
            className="w-32"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            Connecting...
          </Button>
        ) : (
          <Button
            className="bg-green-500 hover:bg-destructive/90 w-32"
            onClick={() => disconnectProxy()}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            {hover ? 'Disconnect' : 'Connected'}
          </Button>
        )}
      </div>
      <PublicAddress publicAddress={publicAddress} />
    </div>
  )
}
