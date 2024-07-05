import cors from '@fastify/cors'
import { NostrRelayPlugin } from '@nostr-relay/common'
import { createOutgoingNoticeMessage, NostrRelay } from '@nostr-relay/core'
import { EventRepositorySqlite } from '@nostr-relay/event-repository-sqlite'
import { Validator } from '@nostr-relay/validator'
import BetterSqlite3 from 'better-sqlite3'
import { app, dialog } from 'electron'
import fastify, { FastifyInstance } from 'fastify'
import { createReadStream, createWriteStream, readFileSync, statSync } from 'fs'
import path from 'path'
import { createInterface } from 'readline'
import { WebSocketServer } from 'ws'
import favicon from '../../resources/favicon.ico?asset'
import { KIND_DESCRIPTION_MAP } from './constants'

type RelayOptions = {
  /**
   * Maximum payload size in kilobytes.
   */
  maxPayload: number
  plugins?: NostrRelayPlugin[]
}

export class Relay {
  private readonly db: BetterSqlite3.Database
  private readonly eventRepository: EventRepositorySqlite
  private readonly validator = new Validator({
    maxFilterGenericTagsLength: 512
  })

  private wss: WebSocketServer | null = null
  private server: FastifyInstance | null = null
  private relay: NostrRelay | null = null

  constructor(private readonly options: RelayOptions) {
    const userPath = app.getPath('userData')
    this.db = new BetterSqlite3(path.join(userPath, 'nostr.db'))
    this.eventRepository = new EventRepositorySqlite(this.db)
  }

  async startServer() {
    this.server = fastify()
    await this.server.register(cors, {
      origin: '*'
    })

    if (!this.server) {
      throw new Error('Server is not initialized.')
    }
    this.wss = new WebSocketServer({
      server: this.server.server,
      maxPayload: this.options.maxPayload * 1024
    })

    this.relay = new NostrRelay(this.eventRepository)

    for (const plugin of this.options.plugins ?? []) {
      this.relay.register(plugin)
    }

    this.handleWssEvent(this.wss, this.relay)

    const faviconFile = readFileSync(favicon)
    this.server.get('/favicon.ico', function (_, reply) {
      reply.header('cache-control', 'max-age=604800').type('image/x-icon').send(faviconFile)
    })

    this.server.listen({ port: 4869, host: '0.0.0.0' }, function (err) {
      if (err) {
        dialog.showErrorBox('Failed to start server.', err.message)
        app.quit()
      }
    })
  }

  private async stopServer() {
    if (this.server) {
      await this.server.close()
    }
    if (this.wss) {
      this.wss.close()
    }
    if (this.relay) {
      await this.relay.destroy()
    }
  }

  private async restartServer() {
    await this.stopServer()
    await this.startServer()
  }

  private handleWssEvent(wss: WebSocketServer, relay: NostrRelay) {
    wss.on('connection', (ws) => {
      relay.handleConnection(ws)

      ws.on('message', async (data) => {
        try {
          const message = await this.validator.validateIncomingMessage(data)
          await relay.handleMessage(ws, message)
        } catch (error) {
          ws.send(JSON.stringify(createOutgoingNoticeMessage((error as Error).message)))
        }
      })

      ws.on('close', () => {
        relay.handleDisconnect(ws)
      })

      ws.on('error', (error) => {
        if (error.message === 'Max payload size exceeded') return
        throw error
      })
    })
  }

  async updateMaxPayload(maxPayload: number) {
    this.options.maxPayload = maxPayload
    await this.restartServer()
  }

  getTotalEventCount(): number {
    return (this.db.prepare('SELECT COUNT(1) FROM events').get() as { 'COUNT(1)': number })[
      'COUNT(1)'
    ]
  }

  getEventStatistics(): { kind: number; description: string; count: number }[] {
    const result = this.db
      .prepare(
        'SELECT kind, COUNT(1) AS count FROM events GROUP BY kind ORDER BY count DESC LIMIT 8'
      )
      .all() as { kind: number; count: number }[]
    return result.map(({ kind, count }) => ({
      kind,
      description: KIND_DESCRIPTION_MAP[kind] ?? 'unknown',
      count
    }))
  }

  exportEvents(filePath: string, fn: (progress: number) => void) {
    const totalEventCount = this.getTotalEventCount()
    const stream = createWriteStream(filePath)
    const stmt = this.db.prepare('SELECT * FROM events ORDER BY created_at DESC')

    let count = 0
    for (const _row of stmt.iterate()) {
      const row = _row as {
        id: string
        kind: number
        pubkey: string
        content: string
        sig: string
        created_at: number
        tags: string
      }
      stream.write(
        JSON.stringify({
          id: row.id,
          kind: row.kind,
          pubkey: row.pubkey,
          content: row.content,
          sig: row.sig,
          created_at: row.created_at,
          tags: JSON.parse(row.tags)
        }) + '\n'
      )
      count++
      fn(Math.floor((count / totalEventCount) * 100))
    }

    stream.end()
    fn(100)
  }

  importEvents(filePath: string, fn: (progress: number) => void) {
    return new Promise((resolve) => {
      const totalBytes = statSync(filePath).size // Get file size in bytes
      let processedBytes = 0

      const readStream = createReadStream(filePath)
      readStream.on('data', (chunk) => {
        processedBytes += chunk.length
      })
      const rl = createInterface({
        input: readStream,
        crlfDelay: Infinity
      })

      rl.on('line', async (line) => {
        try {
          const event = await this.validator.validateEvent(JSON.parse(line))
          await this.eventRepository.upsert(event)
          fn(Math.floor((processedBytes / totalBytes) * 100))
        } catch {}
      })

      rl.on('close', () => {
        fn(100)
        resolve(true)
      })
    })
  }

  clearEvents() {
    const { changes } = this.db.prepare('DELETE FROM events').run()
    return changes
  }
}
