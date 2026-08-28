import { FIPS_OPEN_PORT_COMMAND, RELAY_PORT } from '@common/constants'
import { TFipsFirewallStatus } from '@common/types'
import { Button } from '@renderer/components/ui/button'
import { Check, Copy, TriangleAlert } from 'lucide-react'
import { useState } from 'react'

export default function FirewallNotice({ firewall }: { firewall: TFipsFirewallStatus }) {
  const [copied, setCopied] = useState(false)

  // Nothing to say when no firewall is filtering the mesh, or the port is open.
  if (firewall.kind === 'not-applicable' || firewall.kind === 'open') return null

  if (firewall.kind === 'restricted') {
    return (
      <div className="text-sm text-muted-foreground">
        The fips firewall also limits port {RELAY_PORT} to{' '}
        <span className="font-mono">{firewall.sources.join(', ')}</span>. Peers outside that set
        cannot reach the relay even if you allow their npub here.
      </div>
    )
  }

  if (firewall.kind === 'unknown') {
    return (
      <div className="text-sm text-muted-foreground">
        Could not read the fips firewall rules, so it is unclear whether port {RELAY_PORT} is
        reachable from the mesh.
      </div>
    )
  }

  const copyCommand = async () => {
    await navigator.clipboard.writeText(FIPS_OPEN_PORT_COMMAND)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2 rounded-md border border-destructive/50 p-3">
      <div className="flex gap-2 items-center text-destructive">
        <TriangleAlert size={16} className="shrink-0" />
        <div className="font-medium">Port {RELAY_PORT} is blocked by the fips firewall</div>
      </div>
      <div className="text-sm text-muted-foreground">
        The relay is listening on the mesh, but the kernel drops incoming connections. Run this once
        to open the port &mdash; who may connect is still controlled here.
      </div>
      <div className="flex items-start space-x-2">
        <pre className="flex-1 overflow-x-auto rounded bg-muted p-2 text-xs font-mono">
          {FIPS_OPEN_PORT_COMMAND}
        </pre>
        <Button variant="ghost" size="icon" className="shrink-0" onClick={copyCommand}>
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
    </div>
  )
}
