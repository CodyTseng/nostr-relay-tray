import { TLog } from '@common/types'
import { useEffect, useState } from 'react'
import LogItem from './components/LogItem'

export default function Logs() {
  const [logs, setLogs] = useState<TLog[]>([])

  useEffect(() => {
    window.api.onLog((log) => {
      setLogs((prev) => [...prev, log])
    })
  }, [])

  return (
    <div className="font-mono">
      {logs.map((log, index) => (
        <LogItem key={index} log={log} />
      ))}
    </div>
  )
}
