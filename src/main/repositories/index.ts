import SQLite from 'better-sqlite3'
import { Kysely, Migrator, SqliteDialect, MigrationProvider, Migration } from 'kysely'
import { IDatabase } from './common'
import { RuleRepository } from './rule.repository'

export * from './common'

export async function initRepositories() {
  const dialect = new SqliteDialect({
    database: new SQLite(':memory:')
  })

  const db = new Kysely<IDatabase>({
    dialect
  })

  const migrator = new Migrator({
    db,
    provider: new CustomMigrationProvider()
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`migration "${it.migrationName}" was executed successfully`)
    } else if (it.status === 'Error') {
      console.error(`failed to execute migration "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error('failed to migrate')
    console.error(error)
    process.exit(1)
  }

  return {
    rule: new RuleRepository(db)
  }
}

const migrations: Record<string, Migration> = {
  '001-create-rule-table': {
    up: async (db: Kysely<any>) => {
      await db.schema
        .createTable('rule')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('name', 'text', (col) => col.notNull())
        .addColumn('description', 'text')
        .addColumn('action', 'text', (col) => col.notNull())
        .addColumn('enabled', 'boolean', (col) => col.notNull())
        .addColumn('filter', 'text', (col) => col.notNull())
        .addColumn('conditions', 'text', (col) => col.notNull())
        .execute()
    },
    down: async (db) => {
      await db.schema.dropTable('rule').execute()
    }
  }
}

class CustomMigrationProvider implements MigrationProvider {
  async getMigrations(): Promise<Record<string, Migration>> {
    return migrations
  }
}
