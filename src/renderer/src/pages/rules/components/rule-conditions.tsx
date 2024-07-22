import {
  RULE_CONDITION_FIELD_NAME,
  RULE_CONDITION_FIELD_NAMES,
  TRuleCondition,
  TRuleConditionFieldName
} from '@common/rule'
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

export default function RuleConditions({
  conditions,
  setConditions
}: {
  conditions: TRuleCondition[]
  setConditions: Dispatch<SetStateAction<TRuleCondition[]>>
}): JSX.Element {
  return (
    <div className="space-y-2">
      {conditions.map((_, index) => (
        <RuleCondition
          key={index}
          index={index}
          conditions={conditions}
          setConditions={setConditions}
        />
      ))}
      <Button
        className="w-full"
        variant="outline"
        onClick={() => setConditions([...conditions, { values: [] }])}
        type="button"
      >
        And
      </Button>
    </div>
  )
}

export function RuleCondition({
  index,
  conditions,
  setConditions
}: {
  index: number
  conditions: TRuleCondition[]
  setConditions: Dispatch<SetStateAction<TRuleCondition[]>>
}): JSX.Element {
  const currentRule = conditions[index]
  const selectedFieldNames = conditions.map((rule) => rule.fieldName).filter(Boolean)
  const valuePlaceholder = currentRule.fieldName
    ? currentRule.fieldName === RULE_CONDITION_FIELD_NAME.AUTHOR
      ? 'npub'
      : currentRule.fieldName === RULE_CONDITION_FIELD_NAME.KIND
        ? 'kind number'
        : 'TagName:TagValue'
    : ''
  const valueValidator = getValidator(currentRule.fieldName)

  const [inputValue, setInputValue] = useState('')
  const [isInputValid, setIsInputValid] = useState(true)
  const [valueError, setValueError] = useState<string | null>(null)

  const onFieldNameChange = (fieldName: TRuleConditionFieldName) => {
    const newRules = [...conditions]
    newRules[index] = { fieldName, values: [] }
    setConditions(newRules)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
    setIsInputValid(true)
    setValueError(null)
  }

  const handleInputBlur = () => {
    if (!inputValue) return
    addValue(inputValue)
  }

  const handleInputOnKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addValue(inputValue)
    }
  }

  const addValue = (rawValue) => {
    let value = rawValue.trim()
    try {
      value = valueValidator.parse(value)
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValueError(error.format()._errors[0])
      }
      setIsInputValid(false)
      return
    }

    if (currentRule.values.includes(value)) {
      setInputValue('')
      return
    }

    setInputValue('')
    const newRules = [...conditions]
    newRules[index] = { ...currentRule, values: [...currentRule.values, value] }
    setConditions(newRules)
  }

  const deleteValue = (value) => {
    const newRules = [...conditions]
    newRules[index] = {
      ...currentRule,
      values: currentRule.values.filter((v) => v !== value)
    }
    setConditions(newRules)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Select
          onValueChange={(value: TRuleConditionFieldName) => onFieldNameChange(value)}
          value={currentRule.fieldName}
        >
          <SelectTrigger className="w-32 min-w-32">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {RULE_CONDITION_FIELD_NAMES.map((name) => (
              <SelectItem
                key={name}
                value={name}
                disabled={
                  name === RULE_CONDITION_FIELD_NAME.TAG ? false : selectedFieldNames.includes(name)
                }
              >
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p>IN</p>
        <Input
          className={isInputValid ? '' : 'border-destructive'}
          placeholder={valuePlaceholder}
          disabled={!currentRule.fieldName}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputOnKeyDown}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => addValue(inputValue)}
          disabled={!inputValue.length}
        >
          Add
        </Button>
        {conditions.length > 1 ? (
          <Button
            className="p-0"
            variant="link"
            onClick={() => setConditions(conditions.filter((_, i) => i !== index))}
            type="button"
          >
            <X size={16} />
          </Button>
        ) : null}
      </div>
      {valueError ? <p className="text-destructive pl-40">{valueError}</p> : null}
      <div className="flex flex-wrap pl-40">
        {currentRule.values?.map((value, index) => (
          <Badge key={index} className="flex m-1" variant="secondary">
            {truncateValue(value)}
            <Button
              className="p-0 m-0 h-min"
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

function truncateValue(value: string | number): string | number {
  if (typeof value === 'string' && value.startsWith('npub')) {
    return `${value.slice(0, 8)}...${value.slice(-4)}`
  }
  return value
}

function getValidator(fieldName?: TRuleConditionFieldName) {
  switch (fieldName) {
    case RULE_CONDITION_FIELD_NAME.AUTHOR:
      return z
        .string({
          message: 'Please enter a npub format public key'
        })
        .regex(/^npub[0-9a-zA-Z]{59}$/, 'Please enter a npub format public key')
    case RULE_CONDITION_FIELD_NAME.KIND:
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
    default:
      return z
        .string({
          message: 'Please enter a string in the format TagName:TagValue'
        })
        .regex(/^.+:.+$/, 'Please enter a string in the format TagName:TagValue')
        .trim()
  }
}
