import {
  ClientContext,
  EventUtils,
  HandleMessagePlugin,
  HandleMessageResult,
  IncomingMessage,
  MessageType,
  Event as NostrEvent
} from '@nostr-relay/common'
import { createOutgoingOkMessage } from '@nostr-relay/core'
import { nip19 } from 'nostr-tools'
import { RULE_ACTION, RULE_CONDITION_FIELD_NAME, TRule, TRuleAction } from '../../common/rule'

export type TRuleFilter = {
  authors: string[]
  kinds: number[]
  tags: string[][]
}

const BLOCKED_MESSAGE = 'blocked:'

export class RestrictionPlugin implements HandleMessagePlugin {
  private defaultAction: TRuleAction = RULE_ACTION.ALLOW
  private filters: TRuleFilter[] = []

  async handleMessage(
    ctx: ClientContext,
    message: IncomingMessage,
    next: () => Promise<HandleMessageResult>
  ): Promise<HandleMessageResult> {
    if (message[0] !== MessageType.EVENT) return next()

    const event = message[1]
    const isMatchingFilters = this.isMatchingFilters(event)
    const needBlock =
      (this.defaultAction === RULE_ACTION.BLOCK && !isMatchingFilters) ||
      (this.defaultAction === RULE_ACTION.ALLOW && isMatchingFilters)

    if (needBlock) {
      ctx.sendMessage(createOutgoingOkMessage(event.id, false, BLOCKED_MESSAGE))
      return { messageType: MessageType.EVENT, success: false, message: BLOCKED_MESSAGE }
    }
    return next()
  }

  updateDefaultAction(action: TRuleAction) {
    this.defaultAction = action
  }

  updateFiltersByRules(rules: TRule[]) {
    this.filters = rules.map((rule) => {
      const filter: TRuleFilter = {
        authors: [],
        kinds: [],
        tags: []
      }
      rule.conditions.forEach((condition) => {
        if (!condition.fieldName || condition.values.length <= 0) return

        if (condition.fieldName === RULE_CONDITION_FIELD_NAME.AUTHOR) {
          filter.authors = condition.values.map((v) => nip19.decode(v as string).data as string)
        } else if (condition.fieldName === RULE_CONDITION_FIELD_NAME.KIND) {
          filter.kinds = condition.values as number[]
        } else if (condition.fieldName === RULE_CONDITION_FIELD_NAME.TAG) {
          filter.tags.push(condition.values as string[])
        }
      })
      return filter
    })
  }

  private isMatchingFilters(event: NostrEvent) {
    return this.filters.some((filter) => {
      if (filter.kinds.length && !filter.kinds.includes(event.kind)) {
        return false
      }

      const author = EventUtils.getAuthor(event, false)
      if (filter.authors.length && !filter.authors.includes(author)) {
        return false
      }

      if (filter.tags.length) {
        const eventTags = event.tags.map(([tagName, tagValue]) => `${tagName}:${tagValue}`)
        return filter.tags.every((arr) => arr.some((item) => eventTags.includes(item)))
      }

      return true
    })
  }
}
