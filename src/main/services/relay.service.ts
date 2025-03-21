import cors from '@fastify/cors'
import {
  Client as NostrClient,
  NostrRelayPlugin,
  createOutgoingNoticeMessage
} from '@nostr-relay/common'
import { NostrRelay } from '@nostr-relay/core'
import { Database, EventRepositorySqlite } from '@nostr-relay/event-repository-sqlite'
import { RawData, Validator } from '@nostr-relay/validator'
import BetterSqlite3 from 'better-sqlite3'
import { app, dialog, ipcMain } from 'electron'
import fastify, { FastifyInstance } from 'fastify'
import { createReadStream, createWriteStream, readFileSync, statSync } from 'fs'
import { Kysely, SqliteDialect } from 'kysely'
import path from 'path'
import { createInterface } from 'readline'
import { WebSocketServer } from 'ws'
import favicon from '../../../resources/favicon.ico?asset'
import { CONFIG_KEY } from '../../common/config'
import { DEFAULT_FILTER_LIMIT, DEFAULT_WSS_MAX_PAYLOAD } from '../../common/constants'
import { TRuleFilter } from '../../common/rule'
import { KIND_DESCRIPTION_MAP } from '../constants'
import { ConfigRepository } from '../repositories/config.repository'
import { TSendToRenderer } from '../types'

type RelayOptions = {
  /**
   * Maximum payload size in kilobytes.
   */
  maxPayload: number
  defaultFilterLimit: number
}

export class RelayService {
  private readonly validator = new Validator({
    maxFilterGenericTagsLength: 512
  })
  private readonly db: BetterSqlite3.Database
  private readonly kysely: Kysely<Database>
  private readonly eventRepository: EventRepositorySqlite

  private options: RelayOptions = {
    maxPayload: DEFAULT_WSS_MAX_PAYLOAD,
    defaultFilterLimit: DEFAULT_FILTER_LIMIT
  }
  private wss: WebSocketServer | null = null
  private server: FastifyInstance | null = null
  private relay: NostrRelay | null = null

  private totalEventCountCache: { data: number; updatedAt: number } | null = null
  private eventStatisticsCache: {
    data: { kind: number; description: string; count: number }[]
    updatedAt: number
  } | null = null

  constructor(
    private readonly configRepository: ConfigRepository,
    private readonly sendToRenderer: TSendToRenderer,
    private readonly plugins: NostrRelayPlugin[] = []
  ) {
    const userPath = app.getPath('userData')
    this.db = new BetterSqlite3(path.join(userPath, 'nostr.db'))
    this.eventRepository = new EventRepositorySqlite(this.db, {
      defaultLimit: this.options.defaultFilterLimit
    })
    this.kysely = new Kysely<Database>({
      dialect: new SqliteDialect({ database: this.db })
    })
  }

  async init() {
    await this.eventRepository.init()
    const [configWssMaxPayload, configDefaultFilterLimit] = await Promise.all([
      this.configRepository.get(CONFIG_KEY.WSS_MAX_PAYLOAD),
      this.configRepository.get(CONFIG_KEY.DEFAULT_FILTER_LIMIT)
    ])
    this.options = {
      maxPayload: configWssMaxPayload ? parseInt(configWssMaxPayload) : DEFAULT_WSS_MAX_PAYLOAD,
      defaultFilterLimit: configDefaultFilterLimit
        ? parseInt(configDefaultFilterLimit)
        : DEFAULT_FILTER_LIMIT
    }

    await this.startServer()

    ipcMain.handle('relay:getTotalEventCount', () => this.getTotalEventCount())
    ipcMain.handle('relay:getEventStatistics', () => this.getEventStatistics())
    ipcMain.handle('relay:exportEvents', async () => {
      const { filePath } = await dialog.showSaveDialog({
        title: 'Export Events',
        filters: [{ name: 'jsonl', extensions: ['jsonl'] }],
        defaultPath: 'events.jsonl'
      })
      if (!filePath) return false

      this.exportEvents(filePath, (progress) => {
        this.sendToRenderer('relay:exportEvents:progress', progress)
      })
      return true
    })
    ipcMain.handle('relay:importEvents', async () => {
      const { filePaths } = await dialog.showOpenDialog({
        title: 'Import Data',
        filters: [{ name: 'jsonl', extensions: ['jsonl'] }],
        properties: ['openFile']
      })
      if (filePaths.length <= 0) return false

      await this.importEvents(filePaths[0], (progress) => {
        this.sendToRenderer('relay:importEvents:progress', progress)
      })
      return true
    })
    ipcMain.handle('relay:clearEvents', () => this.clearEvents())
    ipcMain.handle('relay:updateMaxPayload', (_, maxPayload: number) =>
      this.updateMaxPayload(maxPayload)
    )
    ipcMain.handle('relay:getMaxPayload', () => this.options.maxPayload)
    ipcMain.handle('relay:setDefaultFilterLimit', (_, defaultFilterLimit: number) =>
      this.setDefaultFilterLimit(defaultFilterLimit)
    )
    ipcMain.handle('relay:getDefaultFilterLimit', () => this.options.defaultFilterLimit)
    ipcMain.handle('relay:countEventsByFilter', (_, filter) => this.countEventsByFilter(filter))
    ipcMain.handle('relay:deleteEventsByFilter', (_, filter) => this.deleteEventsByFilter(filter))
  }

  async handleIncomingMessage(client: NostrClient, data: RawData) {
    if (!this.relay) {
      return
    }

    try {
      const message = await this.validator.validateIncomingMessage(data)
      await this.relay.handleMessage(client, message)
    } catch (error) {
      client.send(JSON.stringify(createOutgoingNoticeMessage((error as Error).message)))
    }
  }

  getEventRepository() {
    return this.eventRepository
  }

  register(plugin: NostrRelayPlugin) {
    if (this.relay) {
      this.relay.register(plugin)
    }
  }

  async initSearchIndex() {
    const cursorStr = await this.configRepository.get(CONFIG_KEY.INIT_SEARCH_INDEX_CURSOR)
    let cursor = cursorStr ? parseInt(cursorStr) : Math.floor(Date.now() / 1000)

    while (cursor > 0) {
      const events = await this.eventRepository.find({
        until: cursor,
        limit: 1000,
        kinds: [0, 1, 1111, 9802, 30023, 30024]
      })
      if (events.length === 0) {
        cursor = 0
        await this.configRepository.set(CONFIG_KEY.INIT_SEARCH_INDEX_CURSOR, cursor.toString())
        break
      }
      for (const event of events) {
        await this.eventRepository.insertToSearch(event)
      }
      cursor = events[events.length - 1].created_at - 1
      await this.configRepository.set(CONFIG_KEY.INIT_SEARCH_INDEX_CURSOR, cursor.toString())
      await new Promise((resolve) => setTimeout(resolve, 200)) // Sleep 200ms
    }
  }

  getRelayInfo() {
    return {
      description: 'a nostr relay for desktop',
      name: 'nostr-relay-tray',
      software: 'https://github.com/CodyTseng/nostr-relay-tray',
      supported_nips: [1, 50],
      version: app.getVersion()
    }
  }

  private async updateMaxPayload(maxPayload: number) {
    this.options.maxPayload = maxPayload
    await this.restartServer()
    await this.configRepository.set(CONFIG_KEY.WSS_MAX_PAYLOAD, maxPayload.toString())
  }

  private async setDefaultFilterLimit(defaultFilterLimit: number) {
    this.options.defaultFilterLimit = defaultFilterLimit
    this.eventRepository.setDefaultLimit(defaultFilterLimit)
    await this.configRepository.set(CONFIG_KEY.DEFAULT_FILTER_LIMIT, defaultFilterLimit.toString())
  }

  private async startServer() {
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

    this.eventRepository.setDefaultLimit(this.options.defaultFilterLimit)
    this.relay = new NostrRelay(this.eventRepository)

    for (const plugin of this.plugins ?? []) {
      this.relay.register(plugin)
    }

    this.handleWssEvent(this.wss, this.relay)

    const faviconFile = readFileSync(favicon)
    this.server.get('/favicon.ico', function (_, reply) {
      reply.header('cache-control', 'max-age=604800').type('image/x-icon').send(faviconFile)
    })

    this.server.get('/', () => this.getRelayInfo())

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
        await this.handleIncomingMessage(ws, data)
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

  private getTotalEventCount(): number {
    if (this.totalEventCountCache && Date.now() - this.totalEventCountCache.updatedAt < 1000 * 60) {
      return this.totalEventCountCache.data
    }
    const newTotalEventCount = (
      this.db.prepare('SELECT COUNT(1) FROM events').get() as { 'COUNT(1)': number }
    )['COUNT(1)']
    this.totalEventCountCache = {
      data: newTotalEventCount,
      updatedAt: Date.now()
    }
    return newTotalEventCount
  }

  private getEventStatistics(): { kind: number; description: string; count: number }[] {
    if (this.eventStatisticsCache && Date.now() - this.eventStatisticsCache.updatedAt < 1000 * 60) {
      return this.eventStatisticsCache?.data
    }
    const result = this.db
      .prepare(
        'SELECT kind, COUNT(1) AS count FROM events GROUP BY kind ORDER BY count DESC LIMIT 8'
      )
      .all() as { kind: number; count: number }[]
    const newStatistics = result.map(({ kind, count }) => ({
      kind,
      description: KIND_DESCRIPTION_MAP[kind] ?? 'unknown',
      count
    }))
    this.eventStatisticsCache = {
      data: newStatistics,
      updatedAt: Date.now()
    }
    return newStatistics
  }

  private exportEvents(filePath: string, fn: (progress: number) => void) {
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

  private importEvents(filePath: string, fn: (progress: number) => void) {
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
        } catch {
          // Skip invalid event
        }
      })

      rl.on('close', () => {
        fn(100)
        resolve(true)
      })
    })
  }

  private clearEvents() {
    const { changes } = this.db.prepare('DELETE FROM events').run()
    this.db.prepare('DELETE FROM events_fts').run()
    this.totalEventCountCache = null
    this.eventStatisticsCache = null
    return changes
  }

  private async countEventsByFilter(filter: TRuleFilter) {
    let query = this.kysely.selectFrom('events as e')

    if (filter.ids.length) {
      query = query.where('e.id', 'in', filter.ids)
    }

    if (filter.authors.length) {
      query = query.where('e.author', 'in', filter.authors)
    }
    if (filter.nAuthors.length) {
      query = query.where('e.author', 'not in', filter.nAuthors)
    }

    if (filter.kinds.length) {
      query = query.where('e.kind', 'in', filter.kinds)
    }
    if (filter.nKinds.length) {
      query = query.where('e.kind', 'not in', filter.nKinds)
    }

    const result = await query.select(({ fn }) => [fn.countAll().as('count')]).execute()
    return result[0].count
  }

  private async deleteEventsByFilter(filter: TRuleFilter) {
    let query = this.kysely.deleteFrom('events as e')

    if (filter.ids.length) {
      query = query.where('e.id', 'in', filter.ids)
    }

    if (filter.authors.length) {
      query = query.where('e.author', 'in', filter.authors)
    }
    if (filter.nAuthors.length) {
      query = query.where('e.author', 'not in', filter.nAuthors)
    }

    if (filter.kinds.length) {
      query = query.where('e.kind', 'in', filter.kinds)
    }
    if (filter.nKinds.length) {
      query = query.where('e.kind', 'not in', filter.nKinds)
    }

    const result = await query.execute()
    this.totalEventCountCache = null
    this.eventStatisticsCache = null
    return result.length
  }
}
