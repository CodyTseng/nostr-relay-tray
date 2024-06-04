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

export type Rule = {
  name: string
  description: string
  action: 'block' | 'allow'
  enabled: boolean
}

export const columns: ColumnDef<Rule>[] = [
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
    header: 'Description'
  },
  {
    accessorKey: 'enabled',
    header: 'Enabled',
    cell: ({ row }) => {
      const [enabled, setEnabled] = useState(row.original.enabled)
      const handleSwitch = () => {
        setEnabled(!enabled)
        row
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
            <DropdownMenuItem onClick={() => alert(`Edit payment ID ${row.id}`)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => alert(`Delete payment ID ${row.id}`)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]
