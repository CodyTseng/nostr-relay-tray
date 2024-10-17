import { Switch } from '@renderer/components/ui/switch'
import { useToast } from '@renderer/components/ui/use-toast'
import { useEffect, useState } from 'react'

export default function AutoLaunchOption() {
  const { toast } = useToast()
  const [isAutoLaunchEnabled, setIsAutoLaunchEnabled] = useState(false)
  const [isSetAutoLaunchLoading, setIsSetAutoLaunchLoading] = useState(false)

  const init = async () => {
    const enabled = await window.api.autoLaunch.isEnabled()
    setIsAutoLaunchEnabled(enabled)
  }

  useEffect(() => {
    init()
  }, [])

  const handleAutoLaunchToggle = async () => {
    setIsSetAutoLaunchLoading(true)
    const newEnabled = !isAutoLaunchEnabled
    const success = await window.api.autoLaunch.set(!isAutoLaunchEnabled)
    setIsSetAutoLaunchLoading(false)
    if (success) {
      setIsAutoLaunchEnabled(newEnabled)
    } else {
      toast({
        description: 'Failed to set auto launch',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <div>Start at login</div>
        <div className="text-sm text-muted-foreground">Automatically start on system startup</div>
      </div>
      <Switch
        checked={isAutoLaunchEnabled}
        onClick={handleAutoLaunchToggle}
        disabled={isSetAutoLaunchLoading}
      />
    </div>
  )
}
