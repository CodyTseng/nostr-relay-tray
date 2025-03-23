import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
import { Client as NostrClient } from '@nostr-relay/common'
import { ipcMain } from 'electron'
import { EventEmitter } from 'node:stream'
import { finalizeEvent, generateSecretKey, VerifiedEvent } from 'nostr-tools'
import { WebSocket } from 'ws'
import { CONFIG_KEY } from '../../common/config'
import { PROXY_CONNECTION_STATUS, TProxyConnectionStatus } from '../../common/constants'
import { ConfigRepository } from '../repositories/config.repository'
import { TSendToRenderer } from '../types'
import { getAgent } from '../utils'
import { RelayService } from './relay.service'

const PROXY_URL = 'wss://proxy.nostr-relay.app/register'

export class ProxyConnectorService extends EventEmitter {
  publicAddress: string | null = null
  status: TProxyConnectionStatus = PROXY_CONNECTION_STATUS.DISCONNECTED
  private proxyWs: WebSocket | null = null
  private reconnectCount = 0
  private canReconnect = false
  private reconnectTimeout: NodeJS.Timeout | undefined
  private lastActivity = Date.now()

  constructor(
    private readonly relay: RelayService,
    private readonly configRepository: ConfigRepository,
    private readonly sendToRenderer: TSendToRenderer
  ) {
    super()
  }

  async init() {
    ipcMain.handle('proxy:currentStatus', () => this.getProxyConnectionStatus())
    ipcMain.handle('proxy:connect', () => this.connectToProxy())
    ipcMain.handle('proxy:disconnect', () => this.disconnectFromProxy())
    ipcMain.handle('proxy:publicAddress', () => this.publicAddress)

    const configProxyEnabled = await this.configRepository.get(CONFIG_KEY.PROXY_ENABLED)

    if (configProxyEnabled === 'true') {
      await this.connectToProxy()
    }

    setInterval(() => {
      if (this.status !== PROXY_CONNECTION_STATUS.CONNECTED) return
      if (Date.now() - this.lastActivity > 120_000) {
        this.proxyWs?.close()
      }
    }, 120_000) // 2 minutes
  }

  private async connectToProxy(): Promise<
    | {
        success: false
        errorMessage?: string
      }
    | { success: true; publicAddress: string }
  > {
    const storedPrivateKey = await this.configRepository.get(CONFIG_KEY.PRIVATE_KEY)
    let sk: Uint8Array
    if (!storedPrivateKey) {
      sk = generateSecretKey()
      const hexSk = bytesToHex(sk)
      await this.configRepository.set(CONFIG_KEY.PRIVATE_KEY, hexSk) // maybe need to encrypt this
    } else {
      sk = hexToBytes(storedPrivateKey)
    }
    await this.updateEnabled(true)

    if (this.status === PROXY_CONNECTION_STATUS.CONNECTED && this.publicAddress) {
      return { success: true, publicAddress: this.publicAddress }
    }

    const agent = await getAgent(PROXY_URL)
    return new Promise((resolve) => {
      const ws = new WebSocket(PROXY_URL, { agent })
      this.updateStatus(PROXY_CONNECTION_STATUS.CONNECTING)
      const timeoutTimer = setTimeout(() => {
        if (this.status === PROXY_CONNECTION_STATUS.CONNECTED) {
          return
        }
        ws.close()
        resolve({
          success: false,
          errorMessage: 'Connection timeout.'
        })
      }, 5_000)

      const pingTimer = setInterval(() => {
        if (ws.readyState === 1) {
          ws.ping()
        }
      }, 30_000) // 30 seconds

      let authEvent: VerifiedEvent | null = null

      ws.on('open', () => {
        this.lastActivity = Date.now()
      })

      ws.on('pong', () => {
        this.lastActivity = Date.now()
      })

      const client: NostrClient = {
        readyState: 1,
        send: (data) => ws.send(data)
      }

      ws.on('error', (err) => {
        ws.close()
        resolve({
          success: false,
          errorMessage: err.message
        })
      })

      ws.on('message', async (data) => {
        this.lastActivity = Date.now()
        const message = JSON.parse(data.toString())
        if (!Array.isArray(message)) {
          return
        }
        const type = message[0]

        if (this.status === PROXY_CONNECTION_STATUS.CONNECTING) {
          if (type === 'AUTH') {
            const challenge = message[1]
            authEvent = finalizeEvent(
              {
                kind: 22242,
                tags: [
                  ['challenge', challenge],
                  ['relay', PROXY_URL]
                ],
                content: JSON.stringify(this.relay.getRelayInfo()),
                created_at: Math.floor(Date.now() / 1_000)
              },
              sk
            )
            ws.send(JSON.stringify(['AUTH', authEvent]))
          } else if (type === 'OK') {
            const [, eventId, success, addressOrErrMsg] = message
            if (eventId !== authEvent?.id) return

            if (!success) {
              this.canReconnect = false
              ws.close()
              resolve({
                success: false,
                errorMessage: addressOrErrMsg || 'Authentication failed.'
              })
              return
            }

            this.updateStatus(PROXY_CONNECTION_STATUS.CONNECTED)
            clearTimeout(timeoutTimer)
            this.reconnectCount = 0
            this.canReconnect = true
            this.proxyWs = ws
            this.publicAddress = addressOrErrMsg
            resolve({
              success: true,
              publicAddress: addressOrErrMsg
            })
            return
          }
        } else {
          await this.relay.handleIncomingMessage(client, message)
        }
      })

      ws.on('close', () => {
        this.proxyWs = null
        this.publicAddress = null
        clearInterval(pingTimer)
        clearTimeout(timeoutTimer)

        if (!this.canReconnect) {
          this.updateStatus(PROXY_CONNECTION_STATUS.DISCONNECTED)
          this.reconnectCount = 0
          return resolve({
            success: false,
            errorMessage: 'Failed to connect to the proxy.'
          })
        }

        this.updateStatus(PROXY_CONNECTION_STATUS.CONNECTING)
        this.reconnectCount++

        // Exponential backoff logic:
        const baseDelay = 1_000 // 1 seconds
        const maxDelay = 600_000 // 600 seconds cap
        const delay = Math.min(baseDelay * Math.pow(2, this.reconnectCount - 1), maxDelay)

        this.reconnectTimeout = setTimeout(async () => {
          await this.connectToProxy()
        }, delay)
      })
    })
  }

  private async disconnectFromProxy() {
    await this.updateEnabled(false)

    if (this.status !== PROXY_CONNECTION_STATUS.DISCONNECTED) {
      clearTimeout(this.reconnectTimeout)
      this.canReconnect = false
      if (this.proxyWs) {
        this.proxyWs.close()
      }
      this.updateStatus(PROXY_CONNECTION_STATUS.DISCONNECTED)
    }
  }

  private getProxyConnectionStatus() {
    return this.status
  }

  private updateStatus(status: TProxyConnectionStatus) {
    if (this.status === status) return
    this.status = status
    this.sendToRenderer('proxy:statusChange', status)
    this.emit('status', status)
  }

  private async updateEnabled(enabled: boolean) {
    await this.configRepository.set(CONFIG_KEY.PROXY_ENABLED, `${enabled}`)
  }
}
