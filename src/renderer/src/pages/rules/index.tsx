import { Button } from '@renderer/components/ui/button'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TRow, columns } from './components/columns'
import { DataTable } from './components/data-table'

export default function Rules() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 6 })
  const [data, setData] = useState<TRow[]>([])

  useEffect(() => {
    const fetchAndSetData = async () => {
      const data = await window.api.rule.find(pagination.pageIndex + 1, pagination.pageSize)
      setData(data)
    }
    fetchAndSetData()
  }, [pagination])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Link to="/rules/create">
          <Button>Create rule</Button>
        </Link>
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
