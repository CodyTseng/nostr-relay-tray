import { Filter as NostrFilter } from '@nostr-relay/common'

export const RULE_ACTION = {
  BLOCK: 'block',
  ALLOW: 'allow'
} as const
export type TRuleAction = (typeof RULE_ACTION)[keyof typeof RULE_ACTION]

export type TRuleFilter = Omit<NostrFilter, 'ids' | 'search' | 'limit' | 'since' | 'until'>

export const RULE_CONDITION_FIELD_NAME = {
  AUTHOR: 'author',
  KIND: 'kind',
  a: '#a',
  b: '#b',
  c: '#c',
  d: '#d',
  e: '#e',
  f: '#f',
  g: '#g',
  h: '#h',
  i: '#i',
  j: '#j',
  k: '#k',
  l: '#l',
  m: '#m',
  n: '#n',
  o: '#o',
  p: '#p',
  q: '#q',
  r: '#r',
  s: '#s',
  t: '#t',
  u: '#u',
  v: '#v',
  w: '#w',
  x: '#x',
  y: '#y',
  z: '#z',
  A: '#A',
  B: '#B',
  C: '#C',
  D: '#D',
  E: '#E',
  F: '#F',
  G: '#G',
  H: '#H',
  I: '#I',
  J: '#J',
  K: '#K',
  L: '#L',
  M: '#M',
  N: '#N',
  O: '#O',
  P: '#P',
  Q: '#Q',
  R: '#R',
  S: '#S',
  T: '#T',
  U: '#U',
  V: '#V',
  W: '#W',
  X: '#X',
  Y: '#Y',
  Z: '#Z'
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
