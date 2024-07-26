import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@renderer/components/ui/alert-dialog'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { Input } from '@renderer/components/ui/input'
import { Progress } from '@renderer/components/ui/progress'
import { Download, Loader2, Trash, Upload } from 'lucide-react'
import { useState } from 'react'

export default function Data(): JSX.Element {
  const [exportProgress, setExportProgress] = useState(0)
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [clearConfirmationInputValue, setClearConfirmationInputValue] = useState('')

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

  const handleClear = async () => {
    setIsClearing(true)
    await window.api.clearEvents()
    setIsClearing(false)
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-2">
        <div className="flex justify-between items-center">
          <p>Export all events in this relay.</p>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-28 justify-between px-5"
          >
            {isExporting ? <Loader2 size="16" className="animate-spin" /> : <Upload size="16" />}
            Export
          </Button>
        </div>
        {isExporting && <Progress value={exportProgress} />}
      </Card>
      <Card className="p-4 space-y-2">
        <div className="flex justify-between items-center">
          <p>Import events to this relay.</p>
          <Button
            onClick={handleImport}
            disabled={isImporting}
            className="w-28 justify-between px-5"
          >
            {isImporting ? <Loader2 size="16" className="animate-spin" /> : <Download size="16" />}
            Import
          </Button>
        </div>
        {isImporting && <Progress value={importProgress} />}
      </Card>
      <Card className="p-4 space-y-2">
        <div className="flex justify-between items-center">
          <p>Clear all events in this relay.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isClearing}
                className="w-28 justify-between px-5"
              >
                {isClearing ? <Loader2 size="16" className="animate-spin" /> : <Trash size="16" />}
                Clear
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all events in this
                  relay. Please type <span className="font-bold italic">clear</span> to confirm.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                type="text"
                value={clearConfirmationInputValue}
                onChange={(e) => setClearConfirmationInputValue(e.target.value)}
                placeholder="Type 'clear' to confirm"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleClear}
                  disabled={clearConfirmationInputValue !== 'clear'}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>
    </div>
  )
}
