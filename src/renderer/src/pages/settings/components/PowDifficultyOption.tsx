import { DEFAULT_POW_DIFFICULTY } from '@common/constants'
import { Input } from '@renderer/components/ui/input'
import { useEffect, useState } from 'react'

export default function PowOption() {
  const [powDifficulty, setPowDifficulty] = useState(DEFAULT_POW_DIFFICULTY)

  const init = async () => {
    const powDifficulty = await window.api.pow.getDifficulty()
    setPowDifficulty(powDifficulty)
  }

  useEffect(() => {
    init()
  }, [])

  const handlePowDifficultyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    if (/^\d*$/.test(newValue)) {
      const num = parseInt(newValue)
      if (num >= 0 && num <= 256) {
        setPowDifficulty(isNaN(num) ? 0 : num)
      }
    }
  }

  const handlePowDifficultyBlur = async () => {
    await window.api.pow.setDifficulty(powDifficulty)
  }

  return (
    <div className="flex justify-between items-center">
      <div>
        <div>Pow difficulty</div>
        <div className="text-sm text-muted-foreground">
          The minimum pow difficulty for accepting events
        </div>
      </div>
      <Input
        className="w-14 text-right"
        value={`${powDifficulty}`}
        onChange={handlePowDifficultyChange}
        onBlur={handlePowDifficultyBlur}
      />
    </div>
  )
}
