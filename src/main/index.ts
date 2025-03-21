import { electronApp, is } from '@electron-toolkit/utils'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import {
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  Tray,
  app,
  clipboard,
  ipcMain,
  nativeImage,
  shell
} from 'electron'
import { join } from 'path'
import icon from '../../build/icon.png?asset'
import nostrTemplate from '../../resources/nostrTemplate.png?asset'
import nostrTemplateDark from '../../resources/nostrTemplateDark.png?asset'
import nostrTemplatePurple from '../../resources/nostrTemplatePurple.png?asset'
import { CONFIG_KEY } from '../common/config'
import { TRAY_IMAGE_COLOR, TTrayImageColor } from '../common/constants'
import { initRepositories } from './repositories'
import { ConfigRepository } from './repositories/config.repository'
import { AutoLaunchService } from './services/auto-launch.service'
import { GuardService } from './services/guard.service'
import { LogViewerService } from './services/log-viewer.service'
import { ProxyConnectorService } from './services/proxy-connector.service'
import { RelayService } from './services/relay.service'
import { ThemeService } from './services/theme.service'
import { TSendToRenderer } from './types'
import { getLocalIpAddress } from './utils'

dayjs.extend(duration)

let relay: RelayService

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null
let ready = false

const singleInstanceLock = app.requestSingleInstanceLock()
// Quit the app if another instance is already running
if (!singleInstanceLock) {
  app.quit()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.nostr-relay-tray.app')

  const repositories = await initRepositories()

  const sendToRenderer: TSendToRenderer = (channel, ...args) => {
    mainWindow?.webContents.send(channel, ...args)
  }

  const autoLaunchService = new AutoLaunchService()
  await autoLaunchService.init()

  const themeService = new ThemeService(repositories.config, sendToRenderer)
  await themeService.init()

  const logViewerService = new LogViewerService(sendToRenderer)
  const requestLoggerPlugin = logViewerService.getRequestLoggerPlugin()

  relay = new RelayService(repositories.config, sendToRenderer, [requestLoggerPlugin])
  await relay.init()
  const eventRepository = relay.getEventRepository()

  let trayImageColor = await getTrayImageColor(repositories.config)
  createTray({ trayImage: getTrayImage(trayImageColor) })

  const guardService = new GuardService(repositories.config, repositories.rule, eventRepository)
  await guardService.init()
  relay.register(guardService)

  const proxyConnector = new ProxyConnectorService(relay, repositories.config, sendToRenderer)
  await proxyConnector.init()

  ready = true
  tray?.setContextMenu(createMenu(getLocalIpAddress()))

  ipcMain.handle('tray:getImageColor', () => trayImageColor)
  ipcMain.handle('tray:setImageColor', async (_, color: TTrayImageColor) => {
    trayImageColor = color
    tray?.setImage(getTrayImage(color))
    await repositories.config.set(CONFIG_KEY.TRAY_IMAGE_COLOR, color)
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  await relay.initSearchIndex()
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

function getTrayImage(color: TTrayImageColor) {
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
  mainWindow.on('closed', () => {
    mainWindow = null
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
      tray?.setContextMenu(createMenu(currentLocalIpAddress))
    }
  }, 10000)
}

function createMenu(localIpAddress?: string) {
  const items: MenuItemConstructorOptions[] = [
    {
      label: 'Browse Local Events',
      type: 'normal',
      enabled: ready,
      click: () => {
        shell.openExternal('https://jumble.social/?r=ws://localhost:4869')
      }
    },
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
    { type: 'separator' },
    {
      label: 'Quit',
      role: 'quit'
    }
  ]

  if (localIpAddress) {
    items.splice(3, 0, {
      label: `ws://${localIpAddress}:4869`,
      type: 'normal',
      click: () => clipboard.writeText(`ws://${localIpAddress}:4869`)
    })
  }

  return Menu.buildFromTemplate(items)
}
