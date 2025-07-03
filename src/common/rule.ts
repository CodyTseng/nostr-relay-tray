import { nip19 } from 'nostr-tools'

export const RULE_ACTION = {
  BLOCK: 'block',
  ALLOW: 'allow'
} as const
export type TRuleAction = (typeof RULE_ACTION)[keyof typeof RULE_ACTION]

export const RULE_CONDITION_FIELD_NAME = {
  ID: 'id',
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

export type TRuleFilter = {
  ids: string[]
  authors: string[]
  nAuthors: string[]
  kinds: number[]
  nKinds: number[]
  tags: string[][]
  nTags: string[][]
  contents: RegExp[]
  nContents: RegExp[]
}

export function conditionsToFilter(conditions: TRuleCondition[]) {
  const filter: TRuleFilter = {
    ids: [],
    authors: [],
    nAuthors: [],
    kinds: [],
    nKinds: [],
    tags: [],
    nTags: [],
    contents: [],
    nContents: []
  }
  conditions.forEach((condition) => {
    if (!condition.fieldName || condition.values.length <= 0) return

    if (condition.fieldName === RULE_CONDITION_FIELD_NAME.AUTHOR) {
      if (condition.operator === RULE_CONDITION_OPERATOR.NOT_IN) {
        filter.nAuthors = condition.values.map((v) => nip19.decode(v as string).data as string)
      } else {
        filter.authors = condition.values.map((v) => nip19.decode(v as string).data as string)
      }
    } else if (condition.fieldName === RULE_CONDITION_FIELD_NAME.KIND) {
      if (condition.operator === RULE_CONDITION_OPERATOR.NOT_IN) {
        filter.nKinds = condition.values as number[]
      } else {
        filter.kinds = condition.values as number[]
      }
    } else if (condition.fieldName === RULE_CONDITION_FIELD_NAME.TAG) {
      if (condition.operator === RULE_CONDITION_OPERATOR.NOT_IN) {
        filter.nTags.push(condition.values as string[])
      } else {
        filter.tags.push(condition.values as string[])
      }
    } else if (condition.fieldName === RULE_CONDITION_FIELD_NAME.CONTENT) {
      if (condition.operator === RULE_CONDITION_OPERATOR.NOT_IN) {
        filter.nContents = (condition.values as string[]).map((content) => new RegExp(content))
      } else {
        filter.contents = (condition.values as string[]).map((content) => new RegExp(content))
      }
    } else if (condition.fieldName === RULE_CONDITION_FIELD_NAME.ID) {
      filter.ids = condition.values as string[]
    }
  })
  return filter
}
