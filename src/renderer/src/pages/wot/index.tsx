import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Separator } from '@renderer/components/ui/separator'
import { Switch } from '@renderer/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { useToast } from '@renderer/components/ui/use-toast'
import dayjs from 'dayjs'
import { CircleHelp } from 'lucide-react'
import { useEffect, useState } from 'react'

const NPUB_REGEX = /^npub1[0-9a-z]{58}$/

export default function Wot() {
  const { toast } = useToast()
  const [enabled, setEnabled] = useState(false)
  const [anchor, setAnchor] = useState('')
  const [depth, setDepth] = useState(1)
  const [refreshInterval, setRefreshInterval] = useState(1)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null)
  const [trustedPubkeyCount, setTrustedPubkeyCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [pubkeyToCheck, setPubkeyToCheck] = useState('')
  const [checkDisabled, setCheckDisabled] = useState(true)

  const init = async () => {
    const [enable, anchor, depth, refreshInterval, lastRefreshedAt, trustedPubkeyCount] =
      await Promise.all([
        window.api.wot.getEnabled(),
        window.api.wot.getTrustAnchor(),
        window.api.wot.getTrustDepth(),
        window.api.wot.getRefreshInterval(),
        window.api.wot.getLastRefreshedAt(),
        window.api.wot.getTrustedPubkeyCount()
      ])
    setEnabled(enable)
    setAnchor(anchor)
    setDepth(depth)
    setRefreshInterval(refreshInterval)
    setLastRefreshedAt(lastRefreshedAt)
    setTrustedPubkeyCount(trustedPubkeyCount)
  }

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    updateWotStatus()
  }, [loading])

  const updateWotStatus = async () => {
    const [lastRefreshedAt, trustedPubkeyCount] = await Promise.all([
      window.api.wot.getLastRefreshedAt(),
      window.api.wot.getTrustedPubkeyCount()
    ])
    setLastRefreshedAt(lastRefreshedAt)
    setTrustedPubkeyCount(trustedPubkeyCount)
  }

  const handleEnableToggle = async (newEnabled: boolean) => {
    setEnabled(newEnabled)
    if (newEnabled) {
      if (!NPUB_REGEX.test(anchor)) {
        toast({
          description: 'Invalid pubkey (npub1...)',
          variant: 'destructive',
          duration: 1000
        })
        setEnabled(false)
      } else {
        setLoading(true)
        await window.api.wot.setEnabled(true)
        setLoading(false)
      }
    } else {
      await window.api.wot.setEnabled(false)
    }
  }

  const handleAnchorChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAnchor(value)
    if (NPUB_REGEX.test(value) || value.length === 0) {
      await window.api.wot.setTrustAnchor(value)
    }
  }

  const handleDepthChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (value > 0 && value <= 2) {
      setDepth(value)
      await window.api.wot.setTrustDepth(value)
    }
  }

  const handleRefreshIntervalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (value > 0) {
      setRefreshInterval(value)
      await window.api.wot.setRefreshInterval(value)
    }
  }

  const refreshImmediately = async () => {
    setLoading(true)
    await window.api.wot.refreshTrustedPubkeySet()
    setLoading(false)
  }

  const handlePubkeyToCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPubkeyToCheck(value)
    if (NPUB_REGEX.test(value)) {
      setCheckDisabled(false)
    } else {
      setCheckDisabled(true)
    }
  }

  const checkPubkeyInWot = async (npub) => {
    const result = await window.api.wot.checkNpub(npub)
    if (result) {
      toast({
        description: 'Pubkey is in the WoT',
        duration: 1000
      })
    } else {
      toast({
        description: 'Pubkey is not in the WoT',
        variant: 'destructive',
        duration: 1000
      })
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>Enable WoT</div>
        <Switch checked={enabled} onClick={() => handleEnableToggle(!enabled)} disabled={loading} />
      </div>
      <div className="flex items-center justify-between">
        <div>Your pubkey</div>
        <Input
          type="text"
          value={anchor}
          onChange={handleAnchorChange}
          placeholder="npub1..."
          disabled={loading || enabled}
          className="w-96"
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1 items-center">
          <div>Depth</div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <CircleHelp size={14} />
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-wrap w-80">
                  The depth of the trust net. If the trust depth is 1, the trust net will include
                  you and your following users. If the trust depth is 2, the trust net will include
                  you, your following users, and your following users&rsquo; following users. Now
                  the maximum trust depth is 2.
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          type="number"
          value={depth}
          onChange={handleDepthChange}
          disabled={loading || enabled}
          className="w-16"
        />
      </div>
      <div className="flex items-center justify-between">
        <div>Refresh interval</div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={refreshInterval}
            onChange={handleRefreshIntervalChange}
            disabled={loading || enabled}
            className="w-16"
          />
          <div>Hours</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>Refresh immediately</div>
        <Button variant="secondary" disabled={!enabled || loading} onClick={refreshImmediately}>
          Refresh
        </Button>
      </div>
      <div className="text-muted-foreground text-sm pb-8">
        <div>
          The most recent refresh of the WoT was at{' '}
          {lastRefreshedAt ? dayjs(lastRefreshedAt).format('YYYY-MM-DD HH:mm:ss') : ''}
        </div>
        <div>There are {trustedPubkeyCount} users in the WoT</div>
      </div>
      <Separator />
      <div className="flex items-center justify-between pt-8">
        <div>Check if a pubkey is in the WoT</div>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="npub1..."
            className="w-80"
            onChange={handlePubkeyToCheckChange}
          />
          <Button onClick={() => checkPubkeyInWot(pubkeyToCheck)} disabled={checkDisabled}>
            Check
          </Button>
        </div>
      </div>
    </div>
  )
}
