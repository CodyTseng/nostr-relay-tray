import {
  BeforeHandleEventPlugin,
  BeforeHandleEventResult,
  EventUtils,
  Event as NostrEvent
} from '@nostr-relay/common'
import { conditionsToFilter, TRule } from '../../common/rule'

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
    this.filters = rules.map((rule) => conditionsToFilter(rule.conditions))
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
    this.filters = rules.map((rule) => conditionsToFilter(rule.conditions))
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
