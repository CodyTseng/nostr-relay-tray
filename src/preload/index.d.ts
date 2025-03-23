import { TProxyConnectionStatus, TTheme } from '@common/constants'
import { TNewRule, TRule, TRuleFilter, TRuleUpdate } from '@common/rule'
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      app: {
        onLog: (cb: (event: Electron.IpcRendererEvent, log: TLog) => void) => void
        removeLogListener: (cb: (event: Electron.IpcRendererEvent, log: TLog) => void) => void
        onNavigate: (cb: (event: Electron.IpcRendererEvent, path: string) => void) => void
        removeNavigateListener: (
          cb: (event: Electron.IpcRendererEvent, path: string) => void
        ) => void
      }
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
        countEventsByFilter: (filter: TRuleFilter) => Promise<number>
        deleteEventsByFilter: (filter: TRuleFilter) => Promise<number>
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
        onChange: (cb: (event: Electron.IpcRendererEvent, theme: 'dark' | 'light') => void) => void
        removeChangeListener: (
          cb: (event: Electron.IpcRendererEvent, theme: 'dark' | 'light') => void
        ) => void
        current: () => Promise<'dark' | 'light'>
        currentConfig: () => Promise<TTheme>
        updateConfig: (theme: TTheme) => Promise<void>
      }
      proxy: {
        onStatusChange: (
          cb: (event: Electron.IpcRendererEvent, status: TProxyConnectionStatus) => void
        ) => void
        removeStatusChangeListener: (
          cb: (event: Electron.IpcRendererEvent, status: TProxyConnectionStatus) => void
        ) => void
        currentStatus: () => Promise<TProxyConnectionStatus>
        connect: () => Promise<
          | {
              success: false
              errorMessage?: string
            }
          | {
              success: true
              publicAddress: string
            }
        >
        disconnect: () => Promise<void>
        publicAddress: () => Promise<string | null>
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
