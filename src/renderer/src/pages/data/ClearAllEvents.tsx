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
import { Loader2, Trash } from 'lucide-react'
import { useState } from 'react'

export default function ClearAllEvents(): JSX.Element {
  const [isClearing, setIsClearing] = useState(false)
  const [clearConfirmationInputValue, setClearConfirmationInputValue] = useState('')

  const handleClear = async () => {
    setIsClearing(true)
    await window.api.relay.clearEvents()
    setIsClearing(false)
  }

  return (
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
              {isClearing ? <Loader2 className="animate-spin" /> : <Trash />}
              Clear
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all events in this relay.
                Please type <span className="font-bold italic">clear</span> to confirm.
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
  )
}
