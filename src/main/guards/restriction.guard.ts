import {
  BeforeHandleEventPlugin,
  BeforeHandleEventResult,
  EventUtils,
  Event as NostrEvent
} from '@nostr-relay/common'
import { nip19 } from 'nostr-tools'
import { RULE_CONDITION_FIELD_NAME, RULE_CONDITION_OPERATOR, TRule } from '../../common/rule'

export type TRuleFilter = {
  authors: string[]
  nAuthors: string[]
  kinds: number[]
  nKinds: number[]
  tags: string[][]
  nTags: string[][]
  contents: RegExp[]
  nContents: RegExp[]
}

export class AllowGuard implements BeforeHandleEventPlugin {
  private filters: TRuleFilter[] = []

  beforeHandleEvent(event: NostrEvent): BeforeHandleEventResult {
    if (!isMatchingFilters(event, this.filters)) {
      return {
        canHandle: false,
        message: 'blocked:'
      }
    }
    return { canHandle: true }
  }

  updateFiltersByRules(rules: TRule[]) {
    this.filters = rules.map(formatFilter)
  }
}

export class BlockGuard implements BeforeHandleEventPlugin {
  private filters: TRuleFilter[] = []

  beforeHandleEvent(event: NostrEvent): BeforeHandleEventResult {
    if (isMatchingFilters(event, this.filters)) {
      return {
        canHandle: false,
        message: 'blocked:'
      }
    }
    return { canHandle: true }
  }

  updateFiltersByRules(rules: TRule[]) {
    this.filters = rules.map(formatFilter)
  }
}

function isMatchingFilters(event: NostrEvent, filters: TRuleFilter[]) {
  return filters.some((filter) => {
    if (filter.kinds.length && !filter.kinds.includes(event.kind)) {
      return false
    }
    if (filter.nKinds.length && filter.nKinds.includes(event.kind)) {
      return false
    }

    const author = EventUtils.getAuthor(event, false)
    if (filter.authors.length && !filter.authors.includes(author)) {
      return false
    }
    if (filter.nAuthors.length && filter.nAuthors.includes(author)) {
      return false
    }

    if (
      event.content.length &&
      filter.contents.length &&
      filter.contents.every((content) => !content.test(event.content))
    ) {
      return false
    }
    if (
      event.content.length &&
      filter.nContents.length &&
      filter.nContents.some((content) => content.test(event.content))
    ) {
      return false
    }

    const eventTags = event.tags.map(([tagName, tagValue]) => `${tagName}:${tagValue}`)
    if (
      filter.tags.length &&
      filter.tags.some((arr) => arr.every((item) => !eventTags.includes(item)))
    ) {
      return false
    }
    if (
      filter.nTags.length &&
      filter.nTags.every((arr) => arr.some((item) => eventTags.includes(item)))
    ) {
      return false
    }

    return true
  })
}

function formatFilter(rule: TRule) {
  const filter: TRuleFilter = {
    authors: [],
    nAuthors: [],
    kinds: [],
    nKinds: [],
    tags: [],
    nTags: [],
    contents: [],
    nContents: []
  }
  rule.conditions.forEach((condition) => {
    if (!condition.fieldName || condition.values.length <= 0) return

    if (condition.fieldName === RULE_CONDITION_FIELD_NAME.AUTHOR) {
      if (condition.operator === RULE_CONDITION_OPERATOR.IN) {
        filter.authors = condition.values.map((v) => nip19.decode(v as string).data as string)
      } else {
        filter.nAuthors = condition.values.map((v) => nip19.decode(v as string).data as string)
      }
    } else if (condition.fieldName === RULE_CONDITION_FIELD_NAME.KIND) {
      if (condition.operator === RULE_CONDITION_OPERATOR.IN) {
        filter.kinds = condition.values as number[]
      } else {
        filter.nKinds = condition.values as number[]
      }
    } else if (condition.fieldName === RULE_CONDITION_FIELD_NAME.TAG) {
      if (condition.operator === RULE_CONDITION_OPERATOR.IN) {
        filter.tags.push(condition.values as string[])
      } else {
        filter.nTags.push(condition.values as string[])
      }
    } else if (condition.fieldName === RULE_CONDITION_FIELD_NAME.CONTENT) {
      if (condition.operator === RULE_CONDITION_OPERATOR.IN) {
        filter.contents = (condition.values as string[]).map((content) => new RegExp(content))
      } else {
        filter.nContents = (condition.values as string[]).map((content) => new RegExp(content))
      }
    }
  })
  return filter
}
