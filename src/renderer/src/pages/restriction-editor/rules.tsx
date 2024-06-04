import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { X } from 'lucide-react'
import { ChangeEvent, Dispatch, SetStateAction, useState } from 'react'
import { z } from 'zod'

const FIELD_NAMES = ['author', 'kind', 'tag'] as const
type TFieldName = (typeof FIELD_NAMES)[number]

export type TRule = {
  fieldName?: TFieldName
  values: string[]
}

export default function Rules({
  rules,
  setRules
}: {
  rules: TRule[]
  setRules: Dispatch<SetStateAction<TRule[]>>
}): JSX.Element {
  return (
    <div className="space-y-2">
      {rules.map((_, index) => (
        <Rule index={index} rules={rules} setRules={setRules} />
      ))}
      {rules.length < FIELD_NAMES.length ? (
        <Button
          variant="outline"
          onClick={() => setRules([...rules, { values: [] }])}
          type="button"
        >
          And
        </Button>
      ) : null}
    </div>
  )
}

export function Rule({
  index,
  rules,
  setRules
}: {
  index: number
  rules: TRule[]
  setRules: Dispatch<SetStateAction<TRule[]>>
}): JSX.Element {
  const currentRule = rules[index]
  const selectedFieldNames = rules.map((rule) => rule.fieldName).filter(Boolean)
  const valuePlaceholder =
    currentRule.fieldName === 'author'
      ? 'npub'
      : currentRule.fieldName === 'kind'
        ? 'kind number'
        : currentRule.fieldName === 'tag'
          ? 'tagName:tagValue'
          : ''
  const valueValidator = getValidator(currentRule.fieldName)

  const [inputValue, setInputValue] = useState('')
  const [isInputValid, setIsInputValid] = useState(true)
  const [valueError, setValueError] = useState<string | null>(null)

  const onFieldNameChange = (fieldName: TFieldName) => {
    const newRules = [...rules]
    newRules[index] = { fieldName, values: [] }
    setRules(newRules)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
    setIsInputValid(true)
    setValueError(null)
  }

  const addValue = (value) => {
    if (currentRule.values.includes(value)) {
      setInputValue('')
      return
    }

    if (valueValidator) {
      try {
        valueValidator.parse(value)
      } catch (error) {
        if (error instanceof z.ZodError) {
          setValueError(error.format()._errors[0])
        }
        setIsInputValid(false)
        return
      }
    }

    setInputValue('')
    const newRules = [...rules]
    newRules[index] = { ...currentRule, values: [...currentRule.values, value] }
    setRules(newRules)
  }

  const deleteValue = (value) => {
    const newRules = [...rules]
    newRules[index] = {
      ...currentRule,
      values: currentRule.values.filter((v) => v !== value)
    }
    setRules(newRules)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Select
          onValueChange={(value: TFieldName) => onFieldNameChange(value)}
          value={currentRule.fieldName}
        >
          <SelectTrigger className="w-32 min-w-32">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {FIELD_NAMES.map((name) => (
              <SelectItem value={name} disabled={selectedFieldNames.includes(name)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p>IN</p>
        <Input
          className={isInputValid ? '' : 'border-red-500'}
          placeholder={valuePlaceholder}
          disabled={!currentRule.fieldName}
          value={inputValue}
          onChange={handleInputChange}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => addValue(inputValue)}
          disabled={!inputValue.length}
        >
          Add
        </Button>
        {rules.length > 1 ? (
          <Button
            className="p-0"
            variant="link"
            onClick={() => setRules(rules.filter((_, i) => i !== index))}
            type="button"
          >
            <X size={16} />
          </Button>
        ) : null}
      </div>
      {!!valueError ? <p className="text-red-500 pl-40">{valueError}</p> : null}
      <div className="flex flex-wrap pl-40">
        {currentRule.values?.map((value) => (
          <Badge className="flex m-1" variant="secondary">
            {truncateValue(value)}
            <Button
              className="p-0 m-0"
              type="button"
              variant="link"
              onClick={() => deleteValue(value)}
            >
              <X size={16} />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  )
}

function truncateValue(value: string): string {
  if (value.startsWith('npub')) {
    return `${value.slice(0, 8)}...${value.slice(-4)}`
  }
  return value
}

function getValidator(fieldName?: TFieldName) {
  switch (fieldName) {
    case 'author':
      return z
        .string({
          message: 'Please enter a npub format public key'
        })
        .regex(/^npub[0-9a-zA-Z]{59}$/, 'Please enter a npub format public key')
    case 'kind':
      return z.preprocess(
        (value) => {
          if (typeof value === 'string') {
            return parseInt(value, 10)
          }
          throw new Error('Invalid kind number')
        },
        z
          .number()
          .min(0, 'Kind number must be greater than or equal to 0')
          .max(40000, 'Kind number must be less than or equal to 40000')
      )
    case 'tag':
      return z
        .string({
          message: 'Please enter a tag name and value in the format: tagName:tagValue'
        })
        .regex(
          /^[a-zA-Z0-9]+:[a-zA-Z0-9]+$/,
          'Please enter a tag name and value in the format: tagName:tagValue'
        )
    default:
      return undefined
  }
}
