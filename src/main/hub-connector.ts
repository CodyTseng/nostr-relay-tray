import { Client as NostrClient } from '@nostr-relay/common'
import EventEmitter from 'events'
import { WebSocket } from 'ws'
import { HUB_CONNECTION_STATUS, THubConnectionStatus } from '../common/constants'
import { Relay } from './relay'

export class HubConnector extends EventEmitter {
  private hubWs: WebSocket | null = null
  private status: THubConnectionStatus = HUB_CONNECTION_STATUS.DISCONNECTED
  private reconnectCount = 0
  private canReconnect = false
  private reconnectTimeout: NodeJS.Timeout | undefined

  constructor(private readonly relay: Relay) {
    super()
  }

  connectToHub(hubUrl: string): Promise<{
    success: boolean
    errorMessage?: string
  }> {
    return new Promise((resolve) => {
      this.hubWs = new WebSocket(hubUrl)
      this.updateStatus(HUB_CONNECTION_STATUS.CONNECTING)

      const client: NostrClient = {
        readyState: 1,
        send: (data) => this.hubWs!.send(data)
      }

      this.hubWs.on('open', () => {
        this.updateStatus(HUB_CONNECTION_STATUS.CONNECTED)
        this.reconnectCount = 0
        this.canReconnect = true
        resolve({
          success: true
        })
      })

      this.hubWs.once('error', (err) => {
        this.hubWs?.close()
        resolve({
          success: false,
          errorMessage: err.message
        })
      })

      this.hubWs.on('message', async (data) => {
        await this.relay.handleIncomingMessage(client, data)
      })

      this.hubWs.on('close', () => {
        this.hubWs = null
        // 120 * 5s = 10 minutes
        if (!this.canReconnect || this.reconnectCount >= 120) {
          this.updateStatus(HUB_CONNECTION_STATUS.DISCONNECTED)
          this.reconnectCount = 0
          return
        }

        this.reconnectCount++
        this.updateStatus(HUB_CONNECTION_STATUS.CONNECTING)
        this.reconnectTimeout = setTimeout(async () => {
          await this.connectToHub(hubUrl)
        }, 5000)
      })
    })
  }

  disconnectFromHub() {
    if (this.status !== HUB_CONNECTION_STATUS.DISCONNECTED) {
      clearTimeout(this.reconnectTimeout)
      this.canReconnect = false
      if (this.hubWs) {
        this.hubWs.close()
        this.hubWs = null
      }
      this.updateStatus(HUB_CONNECTION_STATUS.DISCONNECTED)
    }
  }

  getHubConnectionStatus() {
    return this.status
  }

  private updateStatus(status: THubConnectionStatus) {
    if (this.status === status) return
    this.status = status
    this.emit('status', status)
  }
}
