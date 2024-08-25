import EventEmitter from 'events'
import { TLog } from '../../common/types'
import { RequestLoggerPlugin } from '../plugins/request-logger.plugin'
import { TSendToRenderer } from '../types'

export class LogViewerService {
  private readonly logEmitter: EventEmitter
  private readonly requestLoggerPlugin: RequestLoggerPlugin

  constructor(sendToRenderer: TSendToRenderer) {
    this.logEmitter = new EventEmitter()
    this.logEmitter.on('log', (log: TLog) => {
      sendToRenderer('log', log)
    })
    this.requestLoggerPlugin = new RequestLoggerPlugin(this.logEmitter)
  }

  getRequestLoggerPlugin() {
    return this.requestLoggerPlugin
  }
}
