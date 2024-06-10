import cors from '@fastify/cors'
import { NostrRelayPlugin } from '@nostr-relay/common'
import { createOutgoingNoticeMessage, NostrRelay } from '@nostr-relay/core'
import { EventRepositorySqlite } from '@nostr-relay/event-repository-sqlite'
import { Validator } from '@nostr-relay/validator'
import BetterSqlite3 from 'better-sqlite3'
import { app, dialog } from 'electron'
import fastify from 'fastify'
import { createReadStream, createWriteStream, readFileSync, statSync } from 'fs'
import path from 'path'
import { createInterface } from 'readline'
import { WebSocketServer } from 'ws'
import favicon from '../../resources/favicon.ico?asset'
import { KIND_DESCRIPTION_MAP } from './constants'

export class Relay {
  private readonly db: BetterSqlite3.Database
  private readonly eventRepository: EventRepositorySqlite
  private readonly validator = new Validator({
    maxFilterGenericTagsLength: 512
  })

  constructor() {
    const userPath = app.getPath('userData')
    this.db = new BetterSqlite3(path.join(userPath, 'nostr.db'))
    this.eventRepository = new EventRepositorySqlite(this.db)
  }

  async init(plugins: NostrRelayPlugin[] = []) {
    const server = fastify()
    await server.register(cors, {
      origin: '*'
    })

    const wss = new WebSocketServer({
      server: server.server,
      maxPayload: 128 * 1024
    })

    const relay = new NostrRelay(this.eventRepository)

    for (const plugin of plugins) {
      relay.register(plugin)
    }

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
    })

    const faviconFile = readFileSync(favicon)
    server.get('/favicon.ico', function (_, reply) {
      reply.header('cache-control', 'max-age=604800').type('image/x-icon').send(faviconFile)
    })

    server.listen({ port: 4869, host: '0.0.0.0' }, function (err) {
      if (err) {
        dialog.showErrorBox('Failed to start server.', err.message)
        app.quit()
      }
    })
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
}
