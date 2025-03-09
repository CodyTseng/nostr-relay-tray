import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { Progress } from '@renderer/components/ui/progress'
import { Loader2, Upload } from 'lucide-react'
import { useState } from 'react'

export default function ExportEvents() {
  const [exportProgress, setExportProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    const startSuccess = await window.api.relay.exportEvents((progress) =>
      setExportProgress(progress)
    )
    if (!startSuccess) {
      console.error('Failed to start export')
    }
    setTimeout(() => {
      setIsExporting(false)
      setExportProgress(0)
    }, 1000)
  }

  return (
    <Card className="p-4 space-y-2">
      <div className="flex justify-between items-center">
        <p>Export all events in this relay.</p>
        <Button onClick={handleExport} disabled={isExporting} className="w-28 justify-between px-5">
          {isExporting ? <Loader2 className="animate-spin" /> : <Upload />}
          Export
        </Button>
      </div>
      {isExporting && <Progress value={exportProgress} />}
    </Card>
  )
}
