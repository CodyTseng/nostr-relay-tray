import { Button } from '@renderer/components/ui/button'
import { useEffect, useState } from 'react'
import { TRow, columns } from './columns'
import { DataTable } from './data-table'

export default function Restrictions() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 6 })
  const [data, setData] = useState<TRow[]>([])

  async function fetchRules(page = 1, pageSize = 6) {
    const data = await window.api.rule.find(page, pageSize)
    setData(data)
  }

  useEffect(() => {
    fetchRules()
  }, [])

  useEffect(() => {
    fetchRules(pagination.pageIndex + 1, pagination.pageSize)
  }, [pagination])

  return (
    <div className="container mx-auto p-2 space-y-4">
      <a href="#/restrictions/rule-editor">
        <Button>Create rule</Button>
      </a>
      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        setPagination={setPagination}
      />
    </div>
  )
}
