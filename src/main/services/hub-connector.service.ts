import { Client as NostrClient } from '@nostr-relay/common'
import { app, ipcMain } from 'electron'
import { WebSocket } from 'ws'
import { CONFIG_KEY } from '../../common/config'
import { HUB_CONNECTION_STATUS, THubConnectionStatus } from '../../common/constants'
import { ConfigRepository } from '../repositories/config.repository'
import { TSendToRenderer } from '../types'
import { getAgent } from '../utils'
import { RelayService } from './relay.service'

export class HubConnectorService {
  private enabled = false
  private hubUrl: string | null = null
  private hubWs: WebSocket | null = null
  private status: THubConnectionStatus = HUB_CONNECTION_STATUS.DISCONNECTED
  private reconnectCount = 0
  private canReconnect = false
  private reconnectTimeout: NodeJS.Timeout | undefined

  constructor(
    private readonly relay: RelayService,
    private readonly configRepository: ConfigRepository,
    private readonly sendToRenderer: TSendToRenderer
  ) {}

  async init() {
    const [configHubEnabled, configHubUrl] = await Promise.all([
      this.configRepository.get(CONFIG_KEY.HUB_ENABLED),
      this.configRepository.get(CONFIG_KEY.HUB_URL)
    ])

    this.enabled = configHubEnabled === 'true'
    this.hubUrl = configHubUrl

    if (this.enabled && this.hubUrl) {
      await this.connectToHub(this.hubUrl)
    }

    ipcMain.handle('hub:currentStatus', () => this.getHubConnectionStatus())
    ipcMain.handle('hub:connect', (_, url: string) => this.connectToHub(url))
    ipcMain.handle('hub:disconnect', () => this.disconnectFromHub())
    ipcMain.handle('hub:getHubUrl', () => this.hubUrl)
    ipcMain.handle('hub:setHubUrl', (_, url: string) => this.updateUrl(url))
    ipcMain.handle('hub:getIsEnabled', () => this.enabled)
  }

  private async connectToHub(hubUrl: string): Promise<{
    success: boolean
    errorMessage?: string
  }> {
    await Promise.all([this.updateEnabled(true), this.updateUrl(hubUrl)])

    if (this.status !== HUB_CONNECTION_STATUS.DISCONNECTED) {
      return { success: true }
    }

    const info = {
      relay: app.getName(),
      version: app.getVersion()
    }
    const agent = await getAgent(hubUrl)
    return new Promise((resolve) => {
      const ws = new WebSocket(hubUrl, { agent })
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

  private async disconnectFromHub() {
    await this.updateEnabled(false)

    if (this.status !== HUB_CONNECTION_STATUS.DISCONNECTED) {
      clearTimeout(this.reconnectTimeout)
      this.canReconnect = false
      if (this.hubWs) {
        this.hubWs.close()
      }
      this.updateStatus(HUB_CONNECTION_STATUS.DISCONNECTED)
    }
  }

  private getHubConnectionStatus() {
    return this.status
  }

  private updateStatus(status: THubConnectionStatus) {
    if (this.status === status) return
    this.status = status
    this.sendToRenderer('hub:statusChange', status)
  }

  private async updateUrl(url: string) {
    if (this.hubUrl === url) return
    this.hubUrl = url
    await this.configRepository.set(CONFIG_KEY.HUB_URL, url)
  }

  private async updateEnabled(enabled: boolean) {
    if (this.enabled === enabled) return
    this.enabled = enabled
    await this.configRepository.set(CONFIG_KEY.HUB_ENABLED, `${enabled}`)
  }
}
