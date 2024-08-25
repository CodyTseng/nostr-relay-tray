import { ipcMain, nativeTheme } from 'electron'
import { CONFIG_KEY } from '../../common/config'
import { THEME, TTheme } from '../../common/constants'
import { ConfigRepository } from '../repositories/config.repository'
import { TSendToRenderer } from '../types'

export class ThemeService {
  private configTheme: TTheme = THEME.SYSTEM

  constructor(
    private configRepository: ConfigRepository,
    private sendToRenderer: TSendToRenderer
  ) {}

  async init() {
    this.configTheme = (await this.configRepository.get(CONFIG_KEY.THEME)) ?? THEME.SYSTEM

    ipcMain.handle('theme:current', () => this.getCurrentTheme())
    ipcMain.handle('theme:currentConfig', () => this.configTheme)
    ipcMain.handle('theme:updateConfig', (_, theme: TTheme) => this.updateConfigTheme(theme))
    nativeTheme.on('updated', () => {
      if (this.configTheme !== THEME.SYSTEM) return
      this.sendCurrentThemeToRenderer()
    })
  }

  getCurrentTheme() {
    if (this.configTheme === THEME.SYSTEM) {
      return nativeTheme.shouldUseDarkColors ? THEME.DARK : THEME.LIGHT
    }
    return this.configTheme
  }

  async updateConfigTheme(theme: TTheme) {
    this.configTheme = theme
    await this.configRepository.set(CONFIG_KEY.THEME, theme)
    this.sendCurrentThemeToRenderer()
  }

  private sendCurrentThemeToRenderer() {
    this.sendToRenderer('theme:change', this.getCurrentTheme())
  }
}
