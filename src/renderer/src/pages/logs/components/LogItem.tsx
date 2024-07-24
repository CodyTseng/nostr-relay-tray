import { TLog } from '@common/types'
import { useState } from 'react'
import dayjs from 'dayjs'
import { SquareMinus, SquarePlus } from 'lucide-react'

export default function LogItem({ log }: { log: TLog }) {
  const [displayData, setDisplayData] = useState(false)

  return (
    <div
      className="px-2 rounded-md hover:bg-secondary cursor-pointer group/item"
      onClick={() => setDisplayData((prev) => !prev)}
    >
      <div className="flex space-x-2 items-center ">
        {displayData ? (
          <SquareMinus className="w-4 h-4 invisible group-hover/item:visible" />
        ) : (
          <SquarePlus className="w-4 h-4 invisible group-hover/item:visible" />
        )}
        <div className="text-muted-foreground">
          {dayjs(log.timestamp).format('MMM DD HH:mm:ss')}
        </div>
        <div>{log.message}</div>
      </div>
      {displayData && (
        <pre className="px-6 py-2 text-muted-foreground">{JSON.stringify(log.data, null, 2)}</pre>
      )}
    </div>
  )
}
