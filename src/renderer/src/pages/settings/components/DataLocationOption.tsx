import { Button } from '@renderer/components/ui/button'
import { useEffect, useState } from 'react'

export default function DataLocationOption() {
  const [dataPath, setDataPath] = useState('')

  const init = async () => {
    const path = await window.api.app.getDataPath()
    setDataPath(path)
  }

  useEffect(() => {
    init()
  }, [])

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div>Data location</div>
        <div className="text-sm text-muted-foreground break-all">{dataPath || 'Loading...'}</div>
      </div>
      <Button
        variant="secondary"
        onClick={() => window.api.app.openDataPath()}
        disabled={!dataPath}
      >
        Open
      </Button>
    </div>
  )
}
