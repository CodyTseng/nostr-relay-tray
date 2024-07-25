import {
  ClientContext,
  HandleMessagePlugin,
  HandleMessageResult,
  IncomingMessage
} from '@nostr-relay/common'
import EventEmitter from 'events'
import { TLog } from '../../common/types'

export class RequestLoggerPlugin implements HandleMessagePlugin {
  constructor(private readonly logEmitter: EventEmitter) {}

  async handleMessage(
    _: ClientContext,
    message: IncomingMessage,
    next: () => Promise<HandleMessageResult>
  ): Promise<HandleMessageResult> {
    const start = Date.now()
    const result = await next()
    this.logEmitter.emit('log', {
      timestamp: Date.now(),
      message: `[${message[0]}] request processed in ${Date.now() - start}ms`,
      data: message
    } as TLog)
    return result
  }
}
