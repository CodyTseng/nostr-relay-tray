import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { Progress } from '@renderer/components/ui/progress'
import { useState } from 'react'

export default function Data(): JSX.Element {
  const [exportProgress, setExportProgress] = useState(0)
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    const startSuccess = await window.api.exportEvents((progress) => setExportProgress(progress))
    if (!startSuccess) {
      console.error('Failed to start export')
    }
    setTimeout(() => {
      setIsExporting(false)
      setExportProgress(0)
    }, 1000)
  }

  const handleImport = async () => {
    setIsImporting(true)
    const startSuccess = await window.api.importEvents((progress) => setImportProgress(progress))
    if (!startSuccess) {
      console.error('Failed to start import')
    }
    setTimeout(() => {
      setIsImporting(false)
      setImportProgress(0)
    }, 1000)
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-2">
        <div className="flex justify-between items-center">
          <p>Export all events in this relay.</p>
          <Button onClick={handleExport} disabled={isExporting}>
            Export
          </Button>
        </div>
        {isExporting && <Progress value={exportProgress} />}
      </Card>
      <Card className="p-4 space-y-2">
        <div className="flex justify-between items-center">
          <p>Import events to this relay.</p>
          <Button onClick={handleImport} disabled={isImporting}>
            Import
          </Button>
        </div>
        {isImporting && <Progress value={importProgress} />}
      </Card>
    </div>
  )
}
