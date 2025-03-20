import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
import { Client as NostrClient } from '@nostr-relay/common'
import { ipcMain } from 'electron'
import { finalizeEvent, generateSecretKey, VerifiedEvent } from 'nostr-tools'
import { WebSocket } from 'ws'
import { CONFIG_KEY } from '../../common/config'
import { PROXY_CONNECTION_STATUS, TProxyConnectionStatus } from '../../common/constants'
import { ConfigRepository } from '../repositories/config.repository'
import { TSendToRenderer } from '../types'
import { getAgent } from '../utils'
import { RelayService } from './relay.service'

const PROXY_URL = 'wss://proxy.nostr-relay.app/register'

export class ProxyConnectorService {
  private proxyWs: WebSocket | null = null
  private publicAddress: string | null = null
  private status: TProxyConnectionStatus = PROXY_CONNECTION_STATUS.DISCONNECTED
  private reconnectCount = 0
  private canReconnect = false
  private reconnectTimeout: NodeJS.Timeout | undefined

  constructor(
    private readonly relay: RelayService,
    private readonly configRepository: ConfigRepository,
    private readonly sendToRenderer: TSendToRenderer
  ) {}

  async init() {
    const configProxyEnabled = await this.configRepository.get(CONFIG_KEY.PROXY_ENABLED)

    if (configProxyEnabled) {
      await this.connectToProxy()
    }

    ipcMain.handle('proxy:currentStatus', () => this.getProxyConnectionStatus())
    ipcMain.handle('proxy:connect', () => this.connectToProxy())
    ipcMain.handle('proxy:disconnect', () => this.disconnectFromProxy())
    ipcMain.handle('proxy:publicAddress', () => this.publicAddress)
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

      let closeTimer: NodeJS.Timeout | null = null
      const setCloseTimer = () => {
        if (closeTimer) {
          clearTimeout(closeTimer)
        }
        closeTimer = setTimeout(() => {
          ws.close()
        }, 180_000)
      }

      const pingTimer = setInterval(() => {
        if (ws.readyState === 1) {
          ws.ping()
        }
      }, 60_000)

      let authEvent: VerifiedEvent | null = null

      ws.on('open', () => {
        setCloseTimer()
      })

      ws.on('pong', () => {
        setCloseTimer()
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
        setCloseTimer()
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
                content: '',
                created_at: Math.floor(Date.now() / 1_000)
              },
              sk
            )
            ws.send(JSON.stringify(['AUTH', authEvent]))
          } else if (type === 'OK') {
            const [, eventId, success, publicAddress] = message
            if (eventId !== authEvent?.id) return

            if (!success) {
              ws.close()
              resolve({
                success: false,
                errorMessage: 'Authentication failed.'
              })
              return
            }

            this.updateStatus(PROXY_CONNECTION_STATUS.CONNECTED)
            clearTimeout(timeoutTimer)
            this.reconnectCount = 0
            this.canReconnect = true
            this.proxyWs = ws
            this.publicAddress = publicAddress
            resolve({
              success: true,
              publicAddress
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
        if (closeTimer) {
          clearTimeout(closeTimer)
        }

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
        this.reconnectTimeout = setTimeout(async () => {
          await this.connectToProxy()
        }, 10000)
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
  }

  private async updateEnabled(enabled: boolean) {
    await this.configRepository.set(CONFIG_KEY.PROXY_ENABLED, `${enabled}`)
  }
}
