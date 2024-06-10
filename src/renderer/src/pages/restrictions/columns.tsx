import { TRuleAction } from '@common/rule'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { Switch } from '@renderer/components/ui/switch'
import { ColumnDef } from '@tanstack/react-table'
import { MoreVertical } from 'lucide-react'
import { useState } from 'react'

export type TRow = {
  id: number
  name: string
  description?: string
  action: TRuleAction
  enabled: boolean
}

export const columns: ColumnDef<TRow>[] = [
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'action',
    header: 'Action'
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      return row.original.description && row.original.description.length > 35
        ? row.original.description.slice(0, 35) + '...'
        : row.original.description
    }
  },
  {
    accessorKey: 'enabled',
    header: 'Enabled',
    cell: ({ row }) => {
      const [enabled, setEnabled] = useState(row.original.enabled)
      const handleSwitch = async () => {
        await window.api.rule.update(row.original.id, { enabled: !enabled })
        setEnabled(!enabled)
      }

      return <Switch checked={enabled} onClick={handleSwitch} />
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                window.location.href = `#/restrictions/rule-editor/${row.original.id}`
              }}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                window.api.rule.delete(row.original.id)
                window.location.reload()
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]
