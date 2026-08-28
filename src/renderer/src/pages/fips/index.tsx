import { FIPS_ACCESS_MODE, TFipsAccessMode } from '@common/constants'
import { TFipsState } from '@common/types'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Separator } from '@renderer/components/ui/separator'
import { Switch } from '@renderer/components/ui/switch'
import { useToast } from '@renderer/components/ui/use-toast'
import { cn } from '@renderer/lib/utils'
import { useEffect, useState } from 'react'
import AllowedNpubs from './AllowedNpubs'
import FirewallNotice from './FirewallNotice'
import MeshAddress from './MeshAddress'

export default function Fips(): JSX.Element {
  const { toast } = useToast()
  const [state, setState] = useState<TFipsState | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.api.fips.getState().then(setState)

    const listener = (_, newState: TFipsState) => setState(newState)
    window.api.fips.onStateChange(listener)
    return () => {
      window.api.fips.removeStateChangeListener(listener)
    }
  }, [])

  const run = async (fn: () => Promise<void>) => {
    setLoading(true)
    try {
      await fn()
      setState(await window.api.fips.getState())
    } catch (error) {
      toast({ description: (error as Error).message, variant: 'destructive' })
      setState(await window.api.fips.getState())
    } finally {
      setLoading(false)
    }
  }

  if (!state) {
    return <div className="text-muted-foreground">Loading...</div>
  }

  const canEnable = state.daemonReachable && state.tunActive
  // Turning the feature on needs a reachable daemon, but turning it off has to stay
  // possible whatever the daemon is doing: a daemon that stops while the feature is on
  // would otherwise leave the switch checked and disabled, with no way to opt out and the
  // relay rebinding to the mesh as soon as it came back.
  const canToggle = state.enabled || canEnable

  return (
    <div className="space-y-4">
      <div className="font-bold text-xl">FIPS mesh</div>

      <NodeStatus state={state} />

      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <div>Serve the relay on the mesh</div>
          <div className="text-sm text-muted-foreground">
            Bind the relay to {state.tunName ?? 'the fips interface'} so other mesh nodes can
            connect
          </div>
        </div>
        <Switch
          checked={state.enabled}
          disabled={loading || !canToggle}
          onCheckedChange={(checked) => run(() => window.api.fips.setEnabled(checked))}
        />
      </div>

      {state.enabled && (
        <>
          <div className="space-y-2">
            <div>Who can connect</div>
            <RadioGroup
              value={state.accessMode}
              disabled={loading}
              onValueChange={(mode) =>
                run(() => window.api.fips.setAccessMode(mode as TFipsAccessMode))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={FIPS_ACCESS_MODE.OPEN} id="fips-open" />
                <Label htmlFor="fips-open">Open to the whole mesh</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={FIPS_ACCESS_MODE.WHITELIST} id="fips-whitelist" />
                <Label htmlFor="fips-whitelist">Only these npubs</Label>
              </div>
            </RadioGroup>
          </div>

          {state.accessMode === FIPS_ACCESS_MODE.WHITELIST && (
            <AllowedNpubs
              allowedNpubs={state.allowedNpubs}
              disabled={loading}
              onAdd={(npub) => window.api.fips.addAllowedNpub(npub)}
              onRemove={(npub) => window.api.fips.removeAllowedNpub(npub)}
            />
          )}

          <FirewallNotice firewall={state.firewall} />

          <MeshAddress npub={state.bound ? state.npub : null} />
        </>
      )}
    </div>
  )
}

function NodeStatus({ state }: { state: TFipsState }) {
  if (!state.daemonReachable) {
    return (
      <div className="space-y-1">
        <StatusLine tone="off" label="fips daemon not running" />
        <div className="text-sm text-muted-foreground">
          Start the fips node to serve your relay on the mesh.
        </div>
      </div>
    )
  }

  if (!state.tunActive) {
    return (
      <div className="space-y-1">
        <StatusLine tone="warn" label="fips daemon running, tun interface inactive" />
        <div className="text-sm text-muted-foreground">
          Enable <span className="font-mono">tun</span> in the fips configuration.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <StatusLine
        tone={state.enabled && state.bound ? 'on' : 'idle'}
        label={`${state.tunName} active - ${state.peerCount} peer${state.peerCount === 1 ? '' : 's'}`}
      />
    </div>
  )
}

function StatusLine({ tone, label }: { tone: 'on' | 'idle' | 'warn' | 'off'; label: string }) {
  const color =
    tone === 'on'
      ? 'bg-green-400'
      : tone === 'warn'
        ? 'bg-orange-400'
        : tone === 'off'
          ? 'bg-red-400'
          : 'bg-gray-400'
  return (
    <div className="flex gap-2 items-center">
      <div className={cn('w-2 h-2 rounded-full shrink-0', color)} />
      <div>{label}</div>
    </div>
  )
}
