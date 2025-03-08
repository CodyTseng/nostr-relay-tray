export const RULE_ACTION = {
  BLOCK: 'block',
  ALLOW: 'allow'
} as const
export type TRuleAction = (typeof RULE_ACTION)[keyof typeof RULE_ACTION]

export const RULE_CONDITION_FIELD_NAME = {
  AUTHOR: 'author',
  KIND: 'kind',
  TAG: 'tag',
  CONTENT: 'content'
} as const
export const RULE_CONDITION_FIELD_NAMES = Object.values(RULE_CONDITION_FIELD_NAME)
export const MAX_RULE_CONDITIONS = RULE_CONDITION_FIELD_NAMES.length
export type TRuleConditionFieldName =
  (typeof RULE_CONDITION_FIELD_NAME)[keyof typeof RULE_CONDITION_FIELD_NAME]

export const RULE_CONDITION_OPERATOR = {
  IN: 'IN',
  NOT_IN: 'NOT IN'
} as const
export const RULE_CONDITION_OPERATORS = Object.values(RULE_CONDITION_OPERATOR)
export type TRuleConditionOperator =
  (typeof RULE_CONDITION_OPERATOR)[keyof typeof RULE_CONDITION_OPERATOR]

export type TRuleCondition = {
  fieldName?: TRuleConditionFieldName
  operator?: TRuleConditionOperator
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
