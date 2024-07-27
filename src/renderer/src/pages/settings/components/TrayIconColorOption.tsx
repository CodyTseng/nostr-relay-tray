import { CONFIG_KEY } from '@common/config'
import { TRAY_IMAGE_COLOR, TTrayImageColor } from '@common/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { useEffect, useState } from 'react'

export default function TrayIconColorOption() {
  const [trayImageColor, setTrayImageColor] = useState<TTrayImageColor>(TRAY_IMAGE_COLOR.BLACK)

  const init = async () => {
    const trayImageColor = await window.api.config.get(CONFIG_KEY.TRAY_IMAGE_COLOR)
    setTrayImageColor(trayImageColor)
  }

  useEffect(() => {
    init()
  }, [])

  const handleTrayImageColorChange = async (value: TTrayImageColor) => {
    await window.api.config.set(CONFIG_KEY.TRAY_IMAGE_COLOR, value)
    setTrayImageColor(value)
  }

  return (
    <>
      {window.electron.process.platform !== 'darwin' ? (
        <div className="flex justify-between items-center">
          <div>
            <div>Tray icon color</div>
            <div className="text-sm text-muted-foreground">
              Customize the color of the tray icon
            </div>
          </div>
          <Select value={trayImageColor} onValueChange={handleTrayImageColorChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tray Image Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TRAY_IMAGE_COLOR.BLACK}>Black</SelectItem>
              <SelectItem value={TRAY_IMAGE_COLOR.WHITE}>White</SelectItem>
              <SelectItem value={TRAY_IMAGE_COLOR.PURPLE}>Purple</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </>
  )
}
