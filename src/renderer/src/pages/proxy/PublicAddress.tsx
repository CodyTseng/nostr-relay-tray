import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
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
    <div className="space-y-2">
      <div className="truncate">Public address:</div>
      <div className="flex items-center space-x-2">
        <Input value={publicAddress} />
        <Button variant="ghost" size="icon" className="shrink-0" onClick={copyAddress}>
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
    </div>
  )
}
