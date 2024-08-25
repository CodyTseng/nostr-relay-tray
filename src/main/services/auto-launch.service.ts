import AutoLaunch from 'auto-launch'
import { ipcMain } from 'electron'

export class AutoLaunchService {
  private isAutoLaunchEnabled = false
  private autoLauncher = new AutoLaunch({ name: 'nostr-relay-tray', isHidden: true })

  async init() {
    this.isAutoLaunchEnabled = await this.autoLauncher.isEnabled().catch(() => false)

    ipcMain.handle('autoLaunch:isEnabled', () => this.isAutoLaunchEnabled)
    ipcMain.handle('autoLaunch:set', (_, enabled: boolean) => this.setAutoLaunch(enabled))
  }

  private async setAutoLaunch(enabled: boolean) {
    if (enabled === this.isAutoLaunchEnabled) return true

    try {
      if (enabled) {
        await this.autoLauncher.enable()
      } else {
        await this.autoLauncher.disable()
      }

      this.isAutoLaunchEnabled = await this.autoLauncher.isEnabled()
      return true
    } catch {
      this.isAutoLaunchEnabled = false
      return false
    }
  }
}
