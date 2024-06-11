import { Checkbox } from '@renderer/components/ui/checkbox'
import { Label } from '@renderer/components/ui/label'
import { useEffect, useState } from 'react'

export default function Settings(): JSX.Element {
  const [isAutoLaunchEnabled, setIsAutoLaunchEnabled] = useState(false)
  const [isSetAutoLaunchFailed, setIsSetAutoLaunchFailed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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

  async function init() {
    const enabled = await window.api.isAutoLaunchEnabled()
    setIsAutoLaunchEnabled(enabled)
  }
  useEffect(() => {
    init()
  }, [])

  return (
    <div className="space-y-4">
      <div className="items-top flex space-x-2">
        <Checkbox
          id="auto-launch-checkbox"
          checked={isAutoLaunchEnabled}
          onClick={handleAutoLaunchToggle}
          disabled={isLoading}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="auto-launch-checkbox">Start at login</Label>
          {isSetAutoLaunchFailed ? (
            <p className="text-sm text-red-500">No permission</p>
          ) : (
            <p className="text-sm text-gray-500">Automatically start on system startup</p>
          )}
        </div>
      </div>
    </div>
  )
}
