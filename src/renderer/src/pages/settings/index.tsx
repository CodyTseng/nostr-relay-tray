import { Checkbox } from '@renderer/components/ui/checkbox'
import { Label } from '@renderer/components/ui/label'
import { useEffect, useState } from 'react'

export default function Settings(): JSX.Element {
  const [isAutoLaunchEnabled, setIsAutoLaunchEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleAutoLaunchToggle() {
    setIsLoading(true)
    const newEnabled = await window.api.setAutoLaunchEnabled(!isAutoLaunchEnabled)
    setIsLoading(false)
    setIsAutoLaunchEnabled(newEnabled)
  }

  async function init() {
    const enabled = await window.api.isAutoLaunchEnabled()
    setIsAutoLaunchEnabled(enabled)
  }
  useEffect(() => {
    init()
  }, [])

  return (
    <div className="p-2 space-y-4">
      <div className="items-center flex space-x-2">
        <Checkbox
          id="auto-launch-checkbox"
          checked={isAutoLaunchEnabled}
          onClick={handleAutoLaunchToggle}
          disabled={isLoading}
        />
        <Label htmlFor="auto-launch-checkbox">Start at login</Label>
      </div>
    </div>
  )
}
