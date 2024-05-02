import { networkInterfaces } from 'os'

export function getLocalIpAddress() {
  const interfaces = networkInterfaces()

  for (const key in interfaces) {
    const iface = interfaces[key]
    if (!iface) continue

    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i]
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address
      }
    }
  }

  return undefined
}
