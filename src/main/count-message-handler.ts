import { WebSocket } from 'ws'
import { Filter } from '@nostr-relay/common'
import BetterSqlite3 from 'better-sqlite3'

export class CountMessageHandler {
  constructor(private readonly db: BetterSqlite3.Database) {}

  async handleCountMessage(ws: WebSocket, subscriptionId: string, filters: Filter[]) {
    const counts = await this.count(filters)
    ws.send(
      JSON.stringify([
        'COUNT',
        subscriptionId,
        { count: counts.reduce((sum, cur) => sum + cur, 0) }
      ])
    )
  }

  private async count(filters: Filter[]): Promise<number[]> {
    return await Promise.all(filters.map((filter) => this.countByFilter(filter)))
  }

  private async countByFilter(filter: Filter): Promise<number> {
    if (filter.search !== undefined) {
      return 0
    }
    return await this._count(filter)
  }

  async _count(filter: Filter): Promise<number> {
    const { ids, authors, kinds, since, until } = filter

    const genericTags = this.extractGenericTagsFrom(filter)
    if (!filter.ids?.length && genericTags.length) {
      return this._countFromGenericTags(filter, genericTags)
    }

    const innerJoinClauses: string[] = []
    const whereClauses: string[] = []
    const whereValues: (string | number)[] = []

    if (genericTags.length) {
      genericTags.forEach((genericTags, index) => {
        const alias = `g${index + 1}`
        innerJoinClauses.push(`INNER JOIN generic_tags ${alias} ON ${alias}.event_id = e.id`)
        whereClauses.push(`${alias}.tag IN (${genericTags.map(() => '?').join(',')})`)
        whereValues.push(...genericTags)
      })
    }

    if (ids?.length) {
      whereClauses.push(`id IN (${ids.map(() => '?').join(',')})`)
      whereValues.push(...ids)
    }

    if (authors?.length) {
      whereClauses.push(`author IN (${authors.map(() => '?').join(',')})`)
      whereValues.push(...authors)
    }

    if (kinds?.length) {
      whereClauses.push(`kind IN (${kinds.map(() => '?').join(',')})`)
      whereValues.push(...kinds)
    }

    if (since) {
      whereClauses.push(`created_at >= ?`)
      whereValues.push(since)
    }

    if (until) {
      whereClauses.push(`created_at <= ?`)
      whereValues.push(until)
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
    const row = this.db
      .prepare(`SELECT COUNT(1) FROM events e ${innerJoinClauses.join(' ')} ${whereClause}`)
      .get(whereValues) as { 'COUNT(1)': number }

    return row['COUNT(1)']
  }

  private async _countFromGenericTags(filter: Filter, genericTags: string[][]): Promise<number> {
    const { authors, kinds, since, until } = filter

    const innerJoinClauses: string[] = []

    // TODO: select more appropriate generic tags
    const [mainGenericTagsFilter, ...restGenericTagsCollection] = genericTags

    const whereClauses: string[] = [`g.tag IN (${mainGenericTagsFilter.map(() => '?').join(',')})`]
    const parameters: (string | number)[] = [...mainGenericTagsFilter]

    if (restGenericTagsCollection.length) {
      restGenericTagsCollection.forEach((genericTags, index) => {
        const alias = `g${index + 1}`
        innerJoinClauses.push(
          `INNER JOIN generic_tags ${alias} ON ${alias}.event_id = g.event_id AND ${alias}.tag IN (${genericTags
            .map(() => '?')
            .join(',')})`
        )
        parameters.push(...genericTags)
      })
    }

    if (authors?.length) {
      whereClauses.push(`g.author IN (${authors.map(() => '?').join(',')})`)
      parameters.push(...authors)
    }

    if (kinds?.length) {
      whereClauses.push(`g.kind IN (${kinds.map(() => '?').join(',')})`)
      parameters.push(...kinds)
    }

    if (since) {
      whereClauses.push(`g.created_at >= ?`)
      parameters.push(since)
    }

    if (until) {
      whereClauses.push(`g.created_at <= ?`)
      parameters.push(until)
    }

    const whereClause = `WHERE ${whereClauses.join(' AND ')}`
    const row = this.db
      .prepare(
        `SELECT DISTINCT g.event_id, COUNT(1) FROM generic_tags g ${innerJoinClauses.join(
          ' '
        )} ${whereClause}`
      )
      .get(parameters) as { 'COUNT(1)': number }

    return row['COUNT(1)']
  }

  private extractGenericTagsFrom(filter: Filter): string[][] {
    return Object.keys(filter)
      .filter((key) => key.startsWith('#'))
      .map((key) => {
        const tagName = key[1]
        return filter[key].map((v: string) => this.toGenericTag(tagName, v))
      })
      .sort((a, b) => a.length - b.length)
  }

  private toGenericTag(tagName: string, tagValue: string): string {
    return `${tagName}:${tagValue}`
  }
}
