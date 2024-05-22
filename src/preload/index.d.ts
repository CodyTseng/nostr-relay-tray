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
    }
  }
}
