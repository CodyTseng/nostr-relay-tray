import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { Progress } from '@renderer/components/ui/progress'
import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function ImportEvents(): JSX.Element {
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async () => {
    setIsImporting(true)
    const startSuccess = await window.api.relay.importEvents((progress) =>
      setImportProgress(progress)
    )
    if (!startSuccess) {
      console.error('Failed to start import')
    }
    setTimeout(() => {
      setIsImporting(false)
      setImportProgress(0)
    }, 1000)
  }

  return (
    <Card className="p-4 space-y-2">
      <div className="flex justify-between items-center">
        <p>Import events to this relay.</p>
        <Button onClick={handleImport} disabled={isImporting} className="w-28 justify-between px-5">
          {isImporting ? <Loader2 className="animate-spin" /> : <Download />}
          Import
        </Button>
      </div>
      {isImporting && <Progress value={importProgress} />}
    </Card>
  )
}
