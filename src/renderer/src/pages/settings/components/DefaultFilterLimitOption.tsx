import { CONFIG_KEY } from '@common/config'
import { DEFAULT_FILTER_LIMIT } from '@common/constants'
import { Input } from '@renderer/components/ui/input'
import { ChangeEvent, useEffect, useState } from 'react'

export default function DefaultFilterLimitOption() {
  const [defaultFilterLimit, setDefaultFilterLimit] = useState(DEFAULT_FILTER_LIMIT)

  const init = async () => {
    const defaultFilterLimit = await window.api.config.get(CONFIG_KEY.DEFAULT_FILTER_LIMIT)
    setDefaultFilterLimit(defaultFilterLimit)
  }

  useEffect(() => {
    init()
  }, [])

  const handleDefaultLimitInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    if (/^\d*$/.test(newValue)) {
      const num = parseInt(newValue)
      setDefaultFilterLimit(isNaN(num) ? 0 : num)
    }
  }

  const handleDefaultLimitInputBlur = async () => {
    await window.api.config.set(CONFIG_KEY.DEFAULT_FILTER_LIMIT, defaultFilterLimit.toString())
  }

  return (
    <div className="flex justify-between items-center">
      <div>
        <div>Default filter limit</div>
        <div className="text-sm text-muted-foreground">
          Default limit value for filtering. (Maximum limit: {10 * defaultFilterLimit})
        </div>
      </div>
      <Input
        className="text-right flex items-center gap-2 w-24"
        value={`${defaultFilterLimit}`}
        onChange={handleDefaultLimitInputChange}
        onBlur={handleDefaultLimitInputBlur}
      />
    </div>
  )
}
