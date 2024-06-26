import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import { TNewRule, TRuleUpdate } from '../common/rule'

// Custom APIs for renderer
const api = {
  getTotalEventCount: () => ipcRenderer.invoke('getTotalEventCount'),
  getEventStatistics: () => ipcRenderer.invoke('getEventStatistics'),
  exportEvents: async (fn: (progress: number) => void) => {
    ipcRenderer.on('exportEvents:progress', (_, progress) => {
      fn(progress)
    })

    const startSuccess = await ipcRenderer.invoke('exportEvents')
    ipcRenderer.removeAllListeners('exportEvents:progress')
    return startSuccess
  },
  importEvents: async (fn: (progress: number) => void) => {
    ipcRenderer.on('importEvents:progress', (_, progress) => {
      fn(progress)
    })

    const startSuccess = await ipcRenderer.invoke('importEvents')
    ipcRenderer.removeAllListeners('importEvents:progress')
    return startSuccess
  },
  isAutoLaunchEnabled: () => ipcRenderer.invoke('isAutoLaunchEnabled'),
  setAutoLaunchEnabled: (enabled: boolean) => ipcRenderer.invoke('setAutoLaunchEnabled', enabled),

  rule: {
    find: (page: number, limit: number) => ipcRenderer.invoke('rule.find', page, limit),
    findById: (id: number) => ipcRenderer.invoke('rule.findById', id),
    update: (id: number, rule: TRuleUpdate) => ipcRenderer.invoke('rule.update', id, rule),
    delete: (id: number) => ipcRenderer.invoke('rule.delete', id),
    create: (rule: TNewRule) => ipcRenderer.invoke('rule.create', rule)
  },
  config: {
    get: (key: string) => ipcRenderer.invoke('config.get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('config.set', key, value)
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
