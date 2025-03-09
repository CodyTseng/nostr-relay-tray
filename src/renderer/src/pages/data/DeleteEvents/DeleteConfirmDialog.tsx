import { conditionsToFilter, TRuleCondition } from '@common/rule'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@renderer/components/ui/alert-dialog'
import { useEffect, useState } from 'react'

export default function DeleteConfirmDialog({
  conditions,
  open,
  onOpenChange,
  startDeleting
}: {
  conditions: TRuleCondition[]
  open: boolean
  onOpenChange: (open: boolean) => void
  startDeleting: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!open) return
    if (conditions.length === 0) {
      setLoading(false)
      return
    }

    const init = async () => {
      setLoading(true)
      const filter = conditionsToFilter(conditions)
      const count = await window.api.relay.countEventsByFilter(filter)
      setCount(count)
      setLoading(false)
    }
    init()
  }, [open])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {loading
              ? 'Counting the number of events that meet the filter...'
              : `This action cannot be undone. This will permanently delete ${count} events.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            variant="destructive"
            onClick={() => startDeleting()}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
