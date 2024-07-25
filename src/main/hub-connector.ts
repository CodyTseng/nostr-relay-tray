import { Client as NostrClient } from '@nostr-relay/common'
import { app } from 'electron'
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
    const info = {
      relay: app.getName(),
      version: app.getVersion()
    }
    return new Promise((resolve) => {
      const ws = new WebSocket(hubUrl)
      this.updateStatus(HUB_CONNECTION_STATUS.CONNECTING)
      const timeoutTimer = setTimeout(() => {
        if (this.status === HUB_CONNECTION_STATUS.CONNECTED) {
          return
        }
        ws.close()
        resolve({
          success: false,
          errorMessage: 'Connection timeout.'
        })
      }, 5000)

      let closeTimer = setTimeout(() => {
        ws.close()
      }, 30000)

      const pingTimer = setInterval(() => {
        if (ws.readyState === 1) {
          ws.ping()
        }
      }, 10000)

      ws.on('pong', () => {
        clearTimeout(closeTimer)
        closeTimer = setTimeout(() => {
          ws.close()
        }, 30000)
      })

      const client: NostrClient = {
        readyState: 1,
        send: (data) => ws.send(data)
      }

      ws.on('open', () => {
        ws.send(JSON.stringify(['JOIN', info]))
      })

      ws.on('error', (err) => {
        ws.close()
        resolve({
          success: false,
          errorMessage: err.message
        })
      })

      ws.on('message', async (data) => {
        const message = JSON.parse(data.toString())
        if (!Array.isArray(message)) {
          return
        }
        const type = message[0]
        if (type === 'JOINED') {
          this.updateStatus(HUB_CONNECTION_STATUS.CONNECTED)
          clearTimeout(timeoutTimer)
          this.reconnectCount = 0
          this.canReconnect = true
          this.hubWs = ws
          resolve({
            success: true
          })
          return
        }

        await this.relay.handleIncomingMessage(client, message)
      })

      ws.on('close', () => {
        this.hubWs = null
        clearInterval(pingTimer)
        clearTimeout(closeTimer)
        clearTimeout(timeoutTimer)

        // 60 * 5s = 5 minutes
        if (!this.canReconnect || this.reconnectCount >= 60) {
          this.updateStatus(HUB_CONNECTION_STATUS.DISCONNECTED)
          this.reconnectCount = 0
          return resolve({
            success: false,
            errorMessage: 'Failed to connect to the hub.'
          })
        }

        this.updateStatus(HUB_CONNECTION_STATUS.CONNECTING)
        this.reconnectCount++
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
