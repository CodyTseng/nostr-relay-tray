import { app } from 'electron'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'
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

export async function getAgent(url: string) {
  const proxyInfo = await app.resolveProxy(url)
  const [firstProxy] = proxyInfo.split(';')
  if (!firstProxy || firstProxy === 'DIRECT') {
    return undefined
  }

  const [type, hostAndPort] = firstProxy.split(' ')

  if (['PROXY', 'HTTPS'].includes(type)) {
    return new HttpsProxyAgent((type === 'HTTPS' ? 'https://' : 'http://') + hostAndPort)
  }

  if (['SOCKS', 'SOCKS5'].includes(type)) {
    return new SocksProxyAgent('socks://' + hostAndPort)
  }

  return undefined
}
