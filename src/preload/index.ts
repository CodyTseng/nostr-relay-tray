import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import { TProxyConnectionStatus, TTheme, TTrayImageColor } from '../common/constants'
import { TNewRule, TRuleFilter, TRuleUpdate } from '../common/rule'
import { TLog } from '../common/types'

// Custom APIs for renderer
const api = {
  app: {
    onLog: (cb: (event: Electron.IpcRendererEvent, log: TLog) => void) => {
      ipcRenderer.on('app:log', cb)
    },
    removeLogListener: (cb: (event: Electron.IpcRendererEvent, log: TLog) => void) => {
      ipcRenderer.removeListener('app:log', cb)
    },
    onNavigate: (cb: (event: Electron.IpcRendererEvent, path: string) => void) => {
      ipcRenderer.on('app:navigate', cb)
    },
    removeNavigateListener: (cb: (event: Electron.IpcRendererEvent, path: string) => void) => {
      ipcRenderer.removeListener('app:navigate', cb)
    }
  },
  autoLaunch: {
    isEnabled: () => ipcRenderer.invoke('autoLaunch:isEnabled'),
    set: (enabled: boolean) => ipcRenderer.invoke('autoLaunch:set', enabled)
  },
  relay: {
    getTotalEventCount: () => ipcRenderer.invoke('relay:getTotalEventCount'),
    getEventStatistics: () => ipcRenderer.invoke('relay:getEventStatistics'),
    exportEvents: async (fn: (progress: number) => void) => {
      ipcRenderer.on('relay:exportEvents:progress', (_, progress) => {
        fn(progress)
      })

      const startSuccess = await ipcRenderer.invoke('relay:exportEvents')
      ipcRenderer.removeAllListeners('relay:exportEvents:progress')
      return startSuccess
    },
    importEvents: async (fn: (progress: number) => void) => {
      ipcRenderer.on('relay:importEvents:progress', (_, progress) => {
        fn(progress)
      })

      const startSuccess = await ipcRenderer.invoke('relay:importEvents')
      ipcRenderer.removeAllListeners('relay:importEvents:progress')
      return startSuccess
    },
    clearEvents: () => ipcRenderer.invoke('relay:clearEvents'),
    updateMaxPayload: (maxPayload: number) =>
      ipcRenderer.invoke('relay:updateMaxPayload', maxPayload),
    getMaxPayload: () => ipcRenderer.invoke('relay:getMaxPayload'),
    setDefaultFilterLimit: (defaultFilterLimit: number) =>
      ipcRenderer.invoke('relay:setDefaultFilterLimit', defaultFilterLimit),
    getDefaultFilterLimit: () => ipcRenderer.invoke('relay:getDefaultFilterLimit'),
    countEventsByFilter: (filter: TRuleFilter) =>
      ipcRenderer.invoke('relay:countEventsByFilter', filter),
    deleteEventsByFilter: (filter: TRuleFilter) =>
      ipcRenderer.invoke('relay:deleteEventsByFilter', filter)
  },
  tray: {
    getImageColor: () => ipcRenderer.invoke('tray:getImageColor'),
    setImageColor: (color: TTrayImageColor) => ipcRenderer.invoke('tray:setImageColor', color)
  },
  rule: {
    find: (page: number, limit: number) => ipcRenderer.invoke('rule:find', page, limit),
    findById: (id: number) => ipcRenderer.invoke('rule:findById', id),
    update: (id: number, rule: TRuleUpdate) => ipcRenderer.invoke('rule:update', id, rule),
    delete: (id: number) => ipcRenderer.invoke('rule:delete', id),
    create: (rule: TNewRule) => ipcRenderer.invoke('rule:create', rule)
  },
  theme: {
    onChange: (cb: (event: Electron.IpcRendererEvent, theme: 'dark' | 'light') => void) => {
      ipcRenderer.on('theme:change', cb)
    },
    removeChangeListener: (
      cb: (event: Electron.IpcRendererEvent, theme: 'dark' | 'light') => void
    ) => {
      ipcRenderer.removeListener('theme:change', cb)
    },
    current: () => ipcRenderer.invoke('theme:current'),
    currentConfig: () => ipcRenderer.invoke('theme:currentConfig'),
    updateConfig: (theme: TTheme) => ipcRenderer.invoke('theme:updateConfig', theme)
  },
  proxy: {
    onStatusChange: (
      cb: (event: Electron.IpcRendererEvent, status: TProxyConnectionStatus) => void
    ) => {
      ipcRenderer.on('proxy:statusChange', cb)
    },
    removeStatusChangeListener: (
      cb: (event: Electron.IpcRendererEvent, status: TProxyConnectionStatus) => void
    ) => {
      ipcRenderer.removeListener('proxy:statusChange', cb)
    },
    currentStatus: () => ipcRenderer.invoke('proxy:currentStatus'),
    connect: () => ipcRenderer.invoke('proxy:connect'),
    disconnect: () => ipcRenderer.invoke('proxy:disconnect'),
    publicAddress: () => ipcRenderer.invoke('proxy:publicAddress')
  },
  wot: {
    getEnabled: () => ipcRenderer.invoke('wot:getEnabled'),
    setEnabled: (enabled: boolean) => ipcRenderer.invoke('wot:setEnabled', enabled),
    getTrustAnchor: () => ipcRenderer.invoke('wot:getTrustAnchor'),
    setTrustAnchor: (trustAnchor: string) => ipcRenderer.invoke('wot:setTrustAnchor', trustAnchor),
    getTrustDepth: () => ipcRenderer.invoke('wot:getTrustDepth'),
    setTrustDepth: (trustDepth: number) => ipcRenderer.invoke('wot:setTrustDepth', trustDepth),
    getRefreshInterval: () => ipcRenderer.invoke('wot:getRefreshInterval'),
    setRefreshInterval: (refreshInterval: number) =>
      ipcRenderer.invoke('wot:setRefreshInterval', refreshInterval),
    refreshTrustedPubkeySet: () => ipcRenderer.invoke('wot:refreshTrustedPubkeySet'),
    getLastRefreshedAt: () => ipcRenderer.invoke('wot:getLastRefreshedAt'),
    getTrustedPubkeyCount: () => ipcRenderer.invoke('wot:getTrustedPubkeyCount'),
    checkNpub: (npub: string) => ipcRenderer.invoke('wot:checkNpub', npub),
    getIsRefreshing: () => ipcRenderer.invoke('wot:getIsRefreshing')
  },
  pow: {
    getDifficulty: () => ipcRenderer.invoke('pow:getPowDifficulty'),
    setDifficulty: (difficulty: number) => ipcRenderer.invoke('pow:setPowDifficulty', difficulty)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
