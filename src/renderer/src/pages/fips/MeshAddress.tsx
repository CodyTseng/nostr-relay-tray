import { getMeshRelayUrl } from '@common/constants'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

export default function MeshAddress({ npub }: { npub?: string | null }) {
  const [copied, setCopied] = useState(false)

  if (!npub) return null

  const url = getMeshRelayUrl(npub)

  const copyAddress = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <div className="space-y-2">
      <div className="truncate">Mesh address:</div>
      <div className="flex items-center space-x-2">
        <Input value={url} readOnly className="font-mono text-xs" />
        <Button variant="ghost" size="icon" className="shrink-0" onClick={copyAddress}>
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
      <div className="text-sm text-muted-foreground">
        Share this with mesh nodes you allow. Their fips resolver turns the{' '}
        <span className="font-mono">.fips</span> name into your node&rsquo;s address.
      </div>
    </div>
  )
}
