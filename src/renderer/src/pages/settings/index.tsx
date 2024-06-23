import { CONFIG_KEY, DEFAULT_WSS_MAX_PAYLOAD } from '@common/config'
import { Input } from '@renderer/components/ui/input'
import { Switch } from '@renderer/components/ui/switch'
import { useEffect, useState } from 'react'

export default function Settings(): JSX.Element {
  const [isAutoLaunchEnabled, setIsAutoLaunchEnabled] = useState(false)
  const [isSetAutoLaunchFailed, setIsSetAutoLaunchFailed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [maxPayload, setMaxPayload] = useState(0)
  const [maxPayloadInputValueError, setMaxPayloadInputValueError] = useState<string | null>(null)

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
      setMaxPayloadInputValueError(null)
      const num = parseInt(newValue)
      setMaxPayload(isNaN(num) ? 0 : num)
    }
  }

  async function handleMaxPayloadInputBlur() {
    if (maxPayload < 1) {
      setMaxPayloadInputValueError('Value must be greater than 0')
      return
    }
    await window.api.config.set(CONFIG_KEY.WSS_MAX_PAYLOAD, maxPayload.toString())
  }

  async function init() {
    const enabled = await window.api.isAutoLaunchEnabled()
    setIsAutoLaunchEnabled(enabled)

    const maxPayloadConfig = await window.api.config.get(CONFIG_KEY.WSS_MAX_PAYLOAD)
    setMaxPayload(maxPayloadConfig ? parseInt(maxPayloadConfig) : DEFAULT_WSS_MAX_PAYLOAD)
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
            <p className="text-sm text-red-500">No permission</p>
          ) : (
            <p className="text-sm text-gray-500">Automatically start on system startup</p>
          )}
        </div>
        <Switch
          checked={isAutoLaunchEnabled}
          onClick={handleAutoLaunchToggle}
          disabled={isLoading}
        />
      </div>
      <div className="flex justify-between items-center">
        <div>Max Payload</div>
        <div className="flex items-center gap-2">
          <div className="h-10">
            <Input
              className={`w-56 text-right ${!maxPayloadInputValueError ? '' : 'border-red-500'}`}
              value={`${maxPayload}`}
              onChange={handleMaxPayloadInputChange}
              onBlur={handleMaxPayloadInputBlur}
            />
            {!!maxPayloadInputValueError ? (
              <p className="text-red-500">{maxPayloadInputValueError}</p>
            ) : null}
          </div>
          <div>KB</div>
        </div>
      </div>
    </div>
  )
}
