export const RULE_ACTION = {
  BLOCK: 'block',
  ALLOW: 'allow'
} as const
export type TRuleAction = (typeof RULE_ACTION)[keyof typeof RULE_ACTION]

export const RULE_CONDITION_FIELD_NAME = {
  AUTHOR: 'author',
  KIND: 'kind',
  TAG: 'tag'
} as const
export const RULE_CONDITION_FIELD_NAMES = Object.values(RULE_CONDITION_FIELD_NAME)
export const MAX_RULE_CONDITIONS = RULE_CONDITION_FIELD_NAMES.length
export type TRuleConditionFieldName =
  (typeof RULE_CONDITION_FIELD_NAME)[keyof typeof RULE_CONDITION_FIELD_NAME]

export type TRuleCondition = {
  fieldName?: TRuleConditionFieldName
  values: (string | number)[]
}

export type TRule = {
  id: number
  name: string
  description?: string
  action: TRuleAction
  enabled: boolean
  conditions: TRuleCondition[]
}
export type TNewRule = Omit<TRule, 'id'>
export type TRuleUpdate = Partial<TNewRule>
