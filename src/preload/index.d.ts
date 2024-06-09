import { TNewRule, TRule, TRuleUpdate } from '@common/rule'
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getTotalEventCount: () => Promise<number>
      getEventStatistics: () => Promise<{ kind: number; count: number; description: string }[]>
      exportEvents: (fn: (progress: number) => void) => Promise<boolean>
      importEvents: (fn: (progress: number) => void) => Promise<boolean>
      isAutoLaunchEnabled: () => Promise<boolean>
      setAutoLaunchEnabled: (enabled: boolean) => Promise<boolean>

      rule: {
        find: (page: number, limit: number) => Promise<TRule[]>
        findById: (id: number) => Promise<TRule | null>
        update: (id: number, rule: TRuleUpdate) => Promise<void>
        delete: (id: number) => Promise<void>
        create: (rule: TNewRule) => Promise<void>
      }
    }
  }
}
