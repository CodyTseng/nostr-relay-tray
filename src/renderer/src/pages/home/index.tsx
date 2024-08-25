import { Card } from '@renderer/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { useEffect, useState } from 'react'

export default function Home(): JSX.Element {
  const [eventStatistics, setEventStatistics] = useState<
    { kind: number; description: string; count: number }[]
  >([])
  const [totalEventCount, setTotalEventCount] = useState(0)

  const init = async () => {
    const cache = window.localStorage.getItem('home')
    if (cache) {
      const { eventStatistics, totalEventCount, expireTimestamp } = JSON.parse(cache)
      setEventStatistics(eventStatistics)
      setTotalEventCount(totalEventCount)
      if (!!expireTimestamp && expireTimestamp > Date.now()) {
        return
      }
    }
    const [eventStatistics, totalEventCount] = await Promise.all([
      window.api.relay.getEventStatistics(),
      window.api.relay.getTotalEventCount()
    ])

    setEventStatistics(eventStatistics)
    setTotalEventCount(totalEventCount)

    window.localStorage.setItem(
      'home',
      JSON.stringify({ eventStatistics, totalEventCount, expireTimestamp: Date.now() + 1000 * 60 })
    )
  }

  useEffect(() => {
    init()
  }, [])

  return (
    <div className="space-y-4">
      <Card className="flex flex-col flex-1 p-4 justify-center">
        <div className="flex justify-between">
          <p className="text-mute">Total Events</p>
        </div>
        <div className="text-4xl font-bold">{totalEventCount}</div>
      </Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>kind</TableHead>
            <TableHead>description</TableHead>
            <TableHead>count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {eventStatistics.map(({ kind, count, description }) => (
            <TableRow key={kind}>
              <TableCell>{kind}</TableCell>
              <TableCell>{description}</TableCell>
              <TableCell>{count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
