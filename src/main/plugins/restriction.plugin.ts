import {
  ClientContext,
  EventUtils,
  HandleMessagePlugin,
  HandleMessageResult,
  IncomingMessage,
  MessageType
} from '@nostr-relay/common'
import { createOutgoingOkMessage } from '@nostr-relay/core'
import { nip19 } from 'nostr-tools'
import {
  RULE_ACTION,
  RULE_CONDITION_FIELD_NAME,
  TRule,
  TRuleAction,
  TRuleFilter
} from '../../common/rule'

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
    const isMatchingFilter = this.filters.some((filter) =>
      EventUtils.isMatchingFilter(event, filter)
    )
    const needBlock =
      (this.defaultAction === RULE_ACTION.BLOCK && !isMatchingFilter) ||
      (this.defaultAction === RULE_ACTION.ALLOW && isMatchingFilter)

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
      const filter: TRuleFilter = {}
      rule.conditions.forEach((condition) => {
        if (!condition.fieldName || condition.values.length <= 0) return
        if (condition.fieldName !== RULE_CONDITION_FIELD_NAME.AUTHOR) {
          filter[condition.fieldName] = condition.values
        }
        filter.authors = condition.values.map((v) => nip19.decode(v as string).data as string)
      })
      return filter
    })
  }
}
