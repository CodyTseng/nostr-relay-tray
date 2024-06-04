import { Button } from '@renderer/components/ui/button'
import { Rule, columns } from './columns'
import { DataTable } from './data-table'

export default function Restrictions() {
  const data: Rule[] = [
    {
      name: 'block-cody',
      description: 'Block Cody',
      action: 'block',
      enabled: false
    },
    {
      name: 'whitelist',
      description: 'Whitelist',
      action: 'allow',
      enabled: true
    }
  ]

  return (
    <div className="container mx-auto p-2 space-y-4">
      <a href="#/restriction-editor">
        <Button>Create rule</Button>
      </a>
      <DataTable columns={columns} data={data} />
    </div>
  )
}
