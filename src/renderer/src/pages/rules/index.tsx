import { RULE_ACTION, TRuleAction } from '@common/rule'
import { Button } from '@renderer/components/ui/button'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TRow, columns } from './components/columns'
import { DataTable } from './components/data-table'

export default function Rules() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 6 })
  const [data, setData] = useState<TRow[]>([])
  const [defaultAction, setDefaultAction] = useState<TRuleAction>(RULE_ACTION.ALLOW)

  const fetchAndSetData = async () => {
    const data = await window.api.rule.find(pagination.pageIndex + 1, pagination.pageSize)
    setData(data)
  }

  const init = async () => {
    await fetchAndSetData()
    const defaultAction = await window.api.rule.getDefaultEventAction()
    if (defaultAction) {
      setDefaultAction(defaultAction as TRuleAction)
    }
  }

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    fetchAndSetData()
  }, [pagination])

  const handleRatioChange = async (value: string) => {
    const defaultAction = value === RULE_ACTION.ALLOW ? RULE_ACTION.ALLOW : RULE_ACTION.BLOCK
    await window.api.rule.setDefaultEventAction(defaultAction)
    setDefaultAction(defaultAction)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Link to="/rules/create">
          <Button>Create rule</Button>
        </Link>
        <RadioGroup
          className="flex"
          value={defaultAction}
          onValueChange={(value) => handleRatioChange(value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={RULE_ACTION.ALLOW} id="r1" />
            <Label htmlFor="r1">Default Allow</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={RULE_ACTION.BLOCK} id="r2" />
            <Label htmlFor="r2">Default Block</Label>
          </div>
        </RadioGroup>
      </div>
      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        setPagination={setPagination}
      />
    </div>
  )
}
