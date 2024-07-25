import { TLog } from '@common/types'
import { Button } from '@renderer/components/ui/button'
import { ScrollArea, ScrollBar } from '@renderer/components/ui/scroll-area'
import { ArrowDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import LogItem from './components/LogItem'

const MAX_LOGS = 5000

export default function Logs() {
  const [logs, setLogs] = useState<TLog[]>([])
  const [isAtBottom, setIsAtBottom] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.api.onLog((log) => {
      setLogs((prev) => {
        const updatedLogs = [...prev, log]
        if (updatedLogs.length > MAX_LOGS) {
          updatedLogs.shift()
        }
        return updatedLogs
      })
    })

    const handleScroll = (e) => {
      const { scrollTop, clientHeight, scrollHeight } = e.target
      if (scrollTop + clientHeight > scrollHeight - 300) {
        setIsAtBottom(true)
      } else {
        setIsAtBottom(false)
      }
    }

    const scrollArea = scrollRef.current
    if (scrollArea) {
      scrollArea.addEventListener('scroll', handleScroll)
    }

    return () => {
      if (scrollArea) {
        scrollArea.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView()
    }
  }, [logs])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView()
  }

  return (
    <ScrollArea ref={scrollRef} className="h-[90vh] px-2 border-solid border rounded-md">
      <div className="w-full">
        <div ref={topRef} />
        {logs.map((log, index) => (
          <LogItem key={index} log={log} />
        ))}
        <div ref={bottomRef} />
        <Button
          disabled={isAtBottom}
          variant="outline"
          className="px-3 absolute bottom-4 right-4"
          onClick={scrollToBottom}
        >
          <ArrowDown size={16} />
        </Button>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
