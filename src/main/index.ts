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
import {
  FIPS_ACCESS_MODE,
  getMeshRelayUrl,
  getMeshRelayUrlLabel,
  TRAY_IMAGE_COLOR,
  TTrayImageColor
} from '../common/constants'
import { TFipsState } from '../common/types'
import { initRepositories } from './repositories'
import { ConfigRepository } from './repositories/config.repository'
import { AutoLaunchService } from './services/auto-launch.service'
import { GuardService } from './services/guard.service'
import { LogViewerService } from './services/log-viewer.service'
import { FipsService } from './services/fips.service'
import { RelayService } from './services/relay.service'
import { ThemeService } from './services/theme.service'
import { TSendToRenderer } from './types'
import { getLocalAddress } from './utils'

dayjs.extend(duration)

let relay: RelayService
let fipsService: FipsService
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

  fipsService = new FipsService(relay, repositories.config, sendToRenderer)
  await fipsService.init()
  fipsService.on('status', () => {
    tray?.setContextMenu(createMenu())
  })

  ready = true
  tray?.setContextMenu(createMenu())

  ipcMain.handle('tray:getImageColor', () => trayImageColor)
  ipcMain.handle('tray:setImageColor', async (_, color: TTrayImageColor) => {
    trayImageColor = color
    tray?.setImage(getTrayImage(color))
    await repositories.config.set(CONFIG_KEY.TRAY_IMAGE_COLOR, color)
  })

  createWindow()

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

function createWindow(path?: string): void {
  if (BrowserWindow.getAllWindows().length > 0) {
    mainWindow?.focus()
    if (path) {
      mainWindow?.webContents.send('app:navigate', path)
    }
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

    // Navigate to specific path if provided
    if (path) {
      mainWindow?.webContents.send('app:navigate', path)
    }
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

  tray.setContextMenu(createMenu())
  setInterval(() => {
    tray?.setContextMenu(createMenu())
  }, 10000)
}

function createMenu() {
  const items: MenuItemConstructorOptions[] = [
    {
      label: 'Browse Local Events',
      type: 'normal',
      click: () => {
        shell.openExternal('https://jumble.social/?r=ws://localhost:4869')
      }
    },
    {
      label: ready ? 'Dashboard' : 'Dashboard (Initializing...)',
      type: 'normal',
      enabled: ready,
      click: () => createWindow()
    },
    { type: 'separator' },
    {
      label: `ws://localhost:4869 - Copy`,
      type: 'normal',
      click: () => clipboard.writeText(`ws://localhost:4869`)
    }
  ]

  const localAddress = getLocalAddress()
  if (localAddress) {
    items.push({
      label: `${localAddress} - Copy`,
      type: 'normal',
      click: () => clipboard.writeText(localAddress)
    })
  }

  const fipsState = fipsService?.getState()
  const meshUrl = fipsState?.bound && fipsState.npub ? getMeshRelayUrl(fipsState.npub) : null
  if (meshUrl && fipsState?.npub) {
    const label = getMeshRelayUrlLabel(fipsState.npub)
    items.push({
      label: `${label} - Copy`,
      type: 'normal',
      // The shortened label is display-only; the full URL is what gets copied.
      click: () => clipboard.writeText(meshUrl)
    })
  }

  items.push(
    { type: 'separator' },
    {
      label: `FIPS - ${describeFipsState(fipsState)}`,
      type: 'normal',
      enabled: ready,
      click: () => createWindow('/fips')
    },
    { type: 'separator' },
    {
      label: 'Quit',
      role: 'quit'
    }
  )

  return Menu.buildFromTemplate(items)
}

function describeFipsState(state: TFipsState | undefined) {
  if (!state) return 'initializing'
  if (!state.daemonReachable) return 'daemon not running'
  if (!state.enabled) return 'disabled'
  if (!state.bound) return 'enabled (not bound)'
  return state.accessMode === FIPS_ACCESS_MODE.WHITELIST
    ? `whitelist (${state.allowedNpubs.length})`
    : 'open to mesh'
}
