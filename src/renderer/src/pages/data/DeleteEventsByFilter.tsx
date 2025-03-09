import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { Trash } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DeleteEventsByFilter() {
  const navigate = useNavigate()
  return (
    <Card className="p-4 space-y-2">
      <div className="flex justify-between items-center">
        <p>Delete events by filter.</p>
        <Button
          onClick={() => navigate('/data/delete')}
          variant="destructive"
          className="w-28 justify-between"
        >
          <Trash />
          Delete
        </Button>
      </div>
    </Card>
  )
}
