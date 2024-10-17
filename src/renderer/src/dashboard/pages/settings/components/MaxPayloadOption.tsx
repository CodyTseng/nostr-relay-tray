import { DEFAULT_WSS_MAX_PAYLOAD } from '@common/constants'
import { Input } from '@renderer/components/ui/input'
import { ChangeEvent, useEffect, useState } from 'react'

export default function MaxPayloadOption() {
  const [maxPayload, setMaxPayload] = useState(DEFAULT_WSS_MAX_PAYLOAD)
  const [maxPayloadInputValueError, setMaxPayloadInputValueError] = useState<boolean>(false)

  const init = async () => {
    const maxPayload = await window.api.relay.getMaxPayload()
    setMaxPayload(maxPayload)
  }

  useEffect(() => {
    init()
  }, [])

  const handleMaxPayloadInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    if (/^\d*$/.test(newValue)) {
      setMaxPayloadInputValueError(false)
      const num = parseInt(newValue)
      setMaxPayload(isNaN(num) ? 0 : num)
    }
  }

  const handleMaxPayloadInputBlur = async () => {
    if (maxPayload < 1) {
      setMaxPayloadInputValueError(true)
      return
    }
    await window.api.relay.updateMaxPayload(maxPayload)
  }

  return (
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
  )
}
