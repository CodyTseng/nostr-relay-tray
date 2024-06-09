import { RULE_ACTION, TRuleAction } from '@common/rule'
import { Button } from '@renderer/components/ui/button'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { useEffect, useState } from 'react'
import { TRow, columns } from './columns'
import { DataTable } from './data-table'

export default function Restrictions() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 6 })
  const [data, setData] = useState<TRow[]>([])
  const [defaultAction, setDefaultAction] = useState<TRuleAction>(RULE_ACTION.ALLOW)

  const fetchAndSetData = async () => {
    const data = await window.api.rule.find(pagination.pageIndex + 1, pagination.pageSize)
    setData(data)
  }

  const init = async () => {
    await fetchAndSetData()
    const defaultAction = await window.api.config.get('default-event-action')
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
    await window.api.config.set('default-event-action', defaultAction)
    setDefaultAction(defaultAction)
  }

  return (
    <div className="container mx-auto p-2 space-y-4">
      <div className="flex justify-between items-center">
        <a href="#/restrictions/rule-editor">
          <Button>Create rule</Button>
        </a>
        <RadioGroup
          className="flex"
          defaultValue={defaultAction}
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
