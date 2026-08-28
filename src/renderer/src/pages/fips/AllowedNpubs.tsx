import { Badge } from '@renderer/components/ui/badge'
import { Input } from '@renderer/components/ui/input'
import { useToast } from '@renderer/components/ui/use-toast'
import { X } from 'lucide-react'
import { ChangeEvent, KeyboardEvent, useState } from 'react'

const NPUB_REGEX = /^npub1[0-9a-z]{58}$/

export default function AllowedNpubs({
  allowedNpubs,
  onAdd,
  onRemove,
  disabled
}: {
  allowedNpubs: string[]
  onAdd: (npub: string) => Promise<void>
  onRemove: (npub: string) => Promise<void>
  disabled?: boolean
}) {
  const { toast } = useToast()
  const [inputValue, setInputValue] = useState('')
  const [isInputValid, setIsInputValid] = useState(true)

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
    setIsInputValid(true)
  }

  const addNpub = async (rawValue: string) => {
    const value = rawValue.trim()
    if (!value) return

    if (!NPUB_REGEX.test(value)) {
      setIsInputValid(false)
      toast({ description: 'Invalid pubkey (npub1...)', variant: 'destructive', duration: 2000 })
      return
    }
    if (allowedNpubs.includes(value)) {
      setInputValue('')
      return
    }

    try {
      await onAdd(value)
      setInputValue('')
    } catch (error) {
      toast({ description: (error as Error).message, variant: 'destructive' })
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addNpub(inputValue)
    }
  }

  return (
    <div className="space-y-2">
      <div>Allowed npubs</div>
      <Input
        value={inputValue}
        placeholder="npub1..."
        disabled={disabled}
        onChange={handleInputChange}
        onBlur={() => addNpub(inputValue)}
        onKeyDown={handleKeyDown}
        className={isInputValid ? '' : 'border-destructive'}
      />
      {allowedNpubs.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {allowedNpubs.map((npub) => (
            <Badge key={npub} variant="secondary" className="gap-1">
              <span className="font-mono">
                {npub.slice(0, 10)}...{npub.slice(-6)}
              </span>
              <X
                size={14}
                className="cursor-pointer shrink-0"
                onClick={() => {
                  if (!disabled) onRemove(npub)
                }}
              />
            </Badge>
          ))}
        </div>
      ) : (
        <div className="text-sm text-destructive">
          No npubs allowed yet, so nothing on the mesh can reach the relay. Add one, or switch to
          &ldquo;Open to the whole mesh&rdquo;.
        </div>
      )}
    </div>
  )
}
