import SQLite from 'better-sqlite3'
import { app } from 'electron'
import { Kysely, Migration, MigrationProvider, Migrator, SqliteDialect } from 'kysely'
import path from 'path'
import { RULE_CONDITION_FIELD_NAME, TRuleCondition } from '../../common/rule'
import { IDatabase } from './common'
import { ConfigRepository } from './config.repository'
import { RuleRepository } from './rule.repository'

export * from './common'

export async function initRepositories() {
  const userPath = app.getPath('userData')
  const dialect = new SqliteDialect({
    database: new SQLite(path.join(userPath, 'app.db'))
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
    rule: new RuleRepository(db),
    config: new ConfigRepository(db)
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
        .addColumn('conditions', 'text', (col) => col.notNull())
        .execute()
    },
    down: async (db) => {
      await db.schema.dropTable('rule').execute()
    }
  },
  '002-create-config-table': {
    up: async (db: Kysely<any>) => {
      await db.schema
        .createTable('config')
        .addColumn('key', 'text', (col) => col.primaryKey())
        .addColumn('value', 'text')
        .execute()
    },
    down: async (db) => {
      await db.schema.dropTable('config').execute()
    }
  },
  '003-fix-rule-condition': {
    up: async (db: Kysely<IDatabase>) => {
      const rules = await db.selectFrom('rule').select(['id', 'conditions']).execute()
      for (const rule of rules) {
        const conditions = JSON.parse(rule.conditions) as TRuleCondition[]
        let needUpdate = false
        const newConditions = conditions.map((condition) => {
          if (condition.fieldName === RULE_CONDITION_FIELD_NAME.KIND) {
            needUpdate = true
            return {
              fieldName: RULE_CONDITION_FIELD_NAME.KIND,
              values: condition.values.map((v) => parseInt(v as string))
            }
          } else {
            return condition
          }
        })
        if (needUpdate) {
          await db
            .updateTable('rule')
            .set({
              conditions: JSON.stringify(newConditions)
            })
            .where('id', '=', rule.id)
            .execute()
        }
      }
    },
    down: async (db: Kysely<IDatabase>) => {
      const rules = await db.selectFrom('rule').select(['id', 'conditions']).execute()
      for (const rule of rules) {
        const conditions = JSON.parse(rule.conditions) as TRuleCondition[]
        let needUpdate = false
        const newConditions = conditions.map((condition) => {
          if (condition.fieldName === RULE_CONDITION_FIELD_NAME.KIND) {
            needUpdate = true
            return {
              fieldName: RULE_CONDITION_FIELD_NAME.KIND,
              values: condition.values.map((v) => v.toString())
            }
          } else {
            return condition
          }
        })
        if (needUpdate) {
          await db
            .updateTable('rule')
            .set({
              conditions: JSON.stringify(newConditions)
            })
            .where('id', '=', rule.id)
            .execute()
        }
      }
    }
  }
}

class CustomMigrationProvider implements MigrationProvider {
  async getMigrations(): Promise<Record<string, Migration>> {
    return migrations
  }
}
