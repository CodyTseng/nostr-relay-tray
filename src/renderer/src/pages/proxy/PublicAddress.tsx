import { Button } from '@renderer/components/ui/button'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

export default function PublicAddress({ publicAddress }: { publicAddress?: string }) {
  const [copied, setCopied] = useState(false)

  if (!publicAddress) return null

  const copyAddress = async () => {
    await navigator.clipboard.writeText(publicAddress)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <div className="flex items-center space-x-2 text-muted-foreground">
      <div className="truncate">Public address: {publicAddress}</div>
      <Button variant="ghost" size="icon" className="shrink-0" onClick={copyAddress}>
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  )
}
