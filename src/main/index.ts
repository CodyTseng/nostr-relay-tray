import { electronApp, is } from '@electron-toolkit/utils'
import AutoLaunch from 'auto-launch'
import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  shell,
  Tray
} from 'electron'
import { join } from 'path'
import icon from '../../build/icon.png?asset'
import nostrTemplate from '../../resources/nostrTemplate.png?asset'
import nostrTemplateDark from '../../resources/nostrTemplateDark.png?asset'
import nostrTemplatePurple from '../../resources/nostrTemplatePurple.png?asset'
import { CONFIG_KEY, DEFAULT_WSS_MAX_PAYLOAD } from '../common/config'
import { RULE_ACTION, TRule, TRuleAction } from '../common/rule'
import { TRAY_IMAGE_COLOR } from '../common/constants'
import { RestrictionPlugin } from './plugins/restriction.plugin'
import { Relay } from './relay'
import { initRepositories } from './repositories'
import { ConfigRepository } from './repositories/config.repository'
import { getLocalIpAddress } from './utils'

let relay: Relay
const autoLauncher = new AutoLaunch({ name: 'nostr-relay-tray', isHidden: true })

let tray: Tray
let mainWindow: BrowserWindow | null = null
let isAutoLaunchEnabled = false

function createWindow(): void {
  if (BrowserWindow.getAllWindows().length > 0) {
    mainWindow?.focus()
    return
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 840,
    height: 630,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined
  })

  // Open the DevTools.
  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow!.setTitle('Nostr Relay Tray')
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray({ trayImage }: { trayImage: Electron.NativeImage }) {
  tray = new Tray(trayImage)

  let currentLocalIpAddress = getLocalIpAddress()
  tray.setContextMenu(createMenu(currentLocalIpAddress))

  setInterval(() => {
    const newLocalIpAddress = getLocalIpAddress()
    if (newLocalIpAddress !== currentLocalIpAddress) {
      currentLocalIpAddress = newLocalIpAddress
      tray.setContextMenu(createMenu(currentLocalIpAddress))
    }
  }, 10000)
}

function createMenu(localIpAddress?: string) {
  return Menu.buildFromTemplate([
    {
      label: 'Dashboard',
      type: 'normal',
      click: createWindow
    },
    { type: 'separator' },
    {
      label: `ws://localhost:4869 - Copy`,
      type: 'normal',
      click: () => clipboard.writeText(`ws://localhost:4869`)
    },
    {
      label: `ws://${localIpAddress}:4869 - Copy`,
      type: 'normal',
      click: () => clipboard.writeText(`ws://${localIpAddress}:4869`)
    },
    { type: 'separator' },
    {
      label: 'Quit',
      role: 'quit'
    }
  ])
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.nostr-relay-tray.app')

  const repositories = await initRepositories()
  const restrictionPlugin = new RestrictionPlugin()

  const updateRestriction = async () => {
    const defaultEventAction =
      (await repositories.config.get(CONFIG_KEY.DEFAULT_EVENT_ACTION)) ?? RULE_ACTION.ALLOW
    restrictionPlugin.updateDefaultAction(defaultEventAction as TRuleAction)

    const rules = await repositories.rule.findAll({
      action: defaultEventAction === RULE_ACTION.ALLOW ? RULE_ACTION.BLOCK : RULE_ACTION.ALLOW,
      enabled: true
    })
    restrictionPlugin.updateFiltersByRules(rules)
  }

  await updateRestriction()

  const wssMaxPayloadStr = await repositories.config.get(CONFIG_KEY.WSS_MAX_PAYLOAD)
  relay = new Relay({
    maxPayload: wssMaxPayloadStr ? parseInt(wssMaxPayloadStr) : DEFAULT_WSS_MAX_PAYLOAD,
    plugins: [restrictionPlugin]
  })
  await relay.startServer()

  ipcMain.handle('getTotalEventCount', () => relay.getTotalEventCount())
  ipcMain.handle('getEventStatistics', () => relay.getEventStatistics())
  ipcMain.handle('exportEvents', async () => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Export Events',
      filters: [{ name: 'jsonl', extensions: ['jsonl'] }],
      defaultPath: 'events.jsonl'
    })
    if (!filePath) return false

    relay.exportEvents(filePath, (progress) => {
      mainWindow?.webContents.send('exportEvents:progress', progress)
    })
    return true
  })
  ipcMain.handle('importEvents', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Import Data',
      filters: [{ name: 'jsonl', extensions: ['jsonl'] }],
      properties: ['openFile']
    })
    if (filePaths.length <= 0) return false

    await relay.importEvents(filePaths[0], (progress) => {
      mainWindow?.webContents.send('importEvents:progress', progress)
    })
    return true
  })
  ipcMain.handle('clearEvents', () => relay.clearEvents())
  ipcMain.handle('isAutoLaunchEnabled', () => isAutoLaunchEnabled)
  ipcMain.handle('setAutoLaunchEnabled', async (_, enabled: boolean) => {
    if (enabled === isAutoLaunchEnabled) return true

    try {
      if (enabled) {
        await autoLauncher.enable()
      } else {
        await autoLauncher.disable()
      }

      isAutoLaunchEnabled = await autoLauncher.isEnabled()
      return true
    } catch {
      isAutoLaunchEnabled = false
      return false
    }
  })

  ipcMain.handle('rule.find', (_, page: number, limit: number) =>
    repositories.rule.find(page, limit)
  )
  ipcMain.handle('rule.findById', (_, id: number) => repositories.rule.findById(id))
  ipcMain.handle('rule.update', async (_, id: number, rule: any) => {
    await repositories.rule.update(id, rule)
    await updateRestriction()
  })
  ipcMain.handle('rule.delete', async (_, id: number) => {
    await repositories.rule.delete(id)
    await updateRestriction()
  })
  ipcMain.handle('rule.create', async (_, rule: TRule) => {
    await repositories.rule.create(rule)
    await updateRestriction()
  })

  ipcMain.handle('config.get', (_, key: string) => repositories.config.get(key))
  ipcMain.handle('config.set', async (_, key: string, value: string) => {
    await repositories.config.set(key, value)
    if (key === CONFIG_KEY.DEFAULT_EVENT_ACTION) {
      await updateRestriction()
    } else if (key === CONFIG_KEY.WSS_MAX_PAYLOAD) {
      await relay.updateMaxPayload(parseInt(value))
    } else if (key === CONFIG_KEY.TRAY_IMAGE_COLOR) {
      tray.setImage(getTrayImage(value as TRAY_IMAGE_COLOR))
    }
  })

  const trayImageColor = await getTrayImageColor(repositories.config)
  createTray({ trayImage: getTrayImage(trayImageColor) })

  autoLauncher
    .isEnabled()
    .then((isEnabled) => (isAutoLaunchEnabled = isEnabled))
    .catch(() => {})

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Prevent the app from closing when the last window is closed
app.on('window-all-closed', (event) => {
  event.preventDefault()
})

const TRAY_IMAGE_MAP = {
  [TRAY_IMAGE_COLOR.PURPLE]: nostrTemplatePurple,
  [TRAY_IMAGE_COLOR.BLACK]: nostrTemplate,
  [TRAY_IMAGE_COLOR.WHITE]: nostrTemplateDark
}

function getTrayImage(color: TRAY_IMAGE_COLOR) {
  return nativeImage.createFromPath(TRAY_IMAGE_MAP[color])
}

async function getTrayImageColor(configRepository: ConfigRepository) {
  // macOS will automatically switch between light and dark mode
  if (process.platform === 'darwin') {
    return TRAY_IMAGE_COLOR.BLACK
  }

  const trayImageColor = await configRepository.get(CONFIG_KEY.TRAY_IMAGE_COLOR)
  if (!trayImageColor) {
    await configRepository.set(CONFIG_KEY.TRAY_IMAGE_COLOR, TRAY_IMAGE_COLOR.PURPLE)
    return TRAY_IMAGE_COLOR.PURPLE
  }
  return trayImageColor
}
