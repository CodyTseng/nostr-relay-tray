import { THubConnectionStatus, TTheme } from '@common/constants'
import { TNewRule, TRule, TRuleUpdate } from '@common/rule'
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      onLog: (cb: (log: TLog) => void) => void
      autoLaunch: {
        isEnabled: () => Promise<boolean>
        set: (enabled: boolean) => Promise<boolean>
      }
      relay: {
        getTotalEventCount: () => Promise<number>
        getEventStatistics: () => Promise<{ kind: number; count: number; description: string }[]>
        exportEvents: (fn: (progress: number) => void) => Promise<boolean>
        importEvents: (fn: (progress: number) => void) => Promise<boolean>
        clearEvents: () => Promise<number>
        updateMaxPayload: (maxPayload: number) => Promise<void>
        getMaxPayload: () => Promise<number>
        setDefaultFilterLimit: (defaultFilterLimit: number) => Promise<void>
        getDefaultFilterLimit: () => Promise<number>
      }
      tray: {
        getImageColor: () => Promise<TTrayImageColor>
        setImageColor: (color: TTrayImageColor) => Promise<void>
      }
      rule: {
        find: (page: number, limit: number) => Promise<TRule[]>
        findById: (id: number) => Promise<TRule | null>
        update: (id: number, rule: TRuleUpdate) => Promise<void>
        delete: (id: number) => Promise<void>
        create: (rule: TNewRule) => Promise<void>
      }
      theme: {
        onChange: (cb: (theme: 'dark' | 'light') => void) => void
        current: () => Promise<'dark' | 'light'>
        currentConfig: () => Promise<TTheme>
        updateConfig: (theme: TTheme) => Promise<void>
      }
      hub: {
        onStatusChange: (cb: (status: THubConnectionStatus) => void) => void
        currentStatus: () => Promise<THubConnectionStatus>
        connect: (url: string) => Promise<{
          success: boolean
          errorMessage?: string
        }>
        disconnect: () => Promise<void>
        getHubUrl: () => Promise<string>
        setHubUrl: (url: string) => Promise<void>
        getIsEnabled: () => Promise<boolean>
      }
      wot: {
        getEnabled: () => Promise<boolean>
        setEnabled: (enabled: boolean) => Promise<void>
        getTrustAnchor: () => Promise<string>
        setTrustAnchor: (trustAnchor: string) => Promise<void>
        getTrustDepth: () => Promise<number>
        setTrustDepth: (trustDepth: number) => Promise<void>
        getRefreshInterval: () => Promise<number>
        setRefreshInterval: (refreshInterval: number) => Promise<void>
        refreshTrustedPubkeySet: () => Promise<void>
        getLastRefreshedAt: () => Promise<number>
        getTrustedPubkeyCount: () => Promise<number>
        checkNpub: (npub: string) => Promise<boolean>
        getIsRefreshing: () => Promise<boolean>
      }
      pow: {
        getDifficulty: () => Promise<number>
        setDifficulty: (difficulty: number) => Promise<void>
      }
    }
  }
}
