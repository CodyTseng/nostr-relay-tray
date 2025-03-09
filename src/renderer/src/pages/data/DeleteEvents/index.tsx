import {
  conditionsToFilter,
  RULE_CONDITION_FIELD_NAME,
  RULE_CONDITION_OPERATOR,
  TRuleCondition
} from '@common/rule'
import RuleConditions from '@renderer/components/RuleConditions'
import { Button } from '@renderer/components/ui/button'
import { ArrowLeft, Loader } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DeleteConfirmDialog from './DeleteConfirmDialog'

export default function DeleteEvents(): JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [conditions, setConditions] = useState<TRuleCondition[]>([
    { operator: RULE_CONDITION_OPERATOR.IN, values: [] }
  ])
  const [confirmedConditions, setConfirmedConditions] = useState<TRuleCondition[]>([])
  const [deleting, setDeleting] = useState(false)
  const isEmptyConditions = useMemo(() => {
    return (
      conditions.filter((condition) => condition.fieldName && condition.values.length > 0)
        .length === 0
    )
  }, [conditions])

  const startDeleting = async () => {
    setDeleting(true)
    const filter = conditionsToFilter(confirmedConditions)
    await window.api.relay.deleteEventsByFilter(filter)
    setDeleting(false)
  }

  return (
    <div className="space-y-4">
      <div className="items-center justify-between flex">
        <Link to="/data">
          <Button variant="link" className="p-0">
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Button>
        </Link>
        <Button
          variant="destructive"
          onClick={() => {
            setConfirmedConditions(conditions)
            setDialogOpen(true)
          }}
          disabled={deleting || isEmptyConditions}
        >
          {deleting && <Loader className="animate-spin" />}
          Delete
        </Button>
      </div>
      <RuleConditions
        conditions={conditions}
        setConditions={setConditions}
        supportedFields={[
          RULE_CONDITION_FIELD_NAME.ID,
          RULE_CONDITION_FIELD_NAME.AUTHOR,
          RULE_CONDITION_FIELD_NAME.KIND
        ]}
      />
      <DeleteConfirmDialog
        conditions={confirmedConditions}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        startDeleting={startDeleting}
      />
    </div>
  )
}
