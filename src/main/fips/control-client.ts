import { statSync } from 'fs'
import net from 'net'
import path from 'path'

export type TFipsNodeStatus = {
  npub: string
  nodeAddr: string
  meshAddress: string
  tunName: string | null
  tunActive: boolean
  version: string
  peerCount: number
}

const REQUEST_TIMEOUT = 3_000

/**
 * Same resolution order the daemon and fipsctl use.
 */
export function resolveControlSocketPath(): string {
  if (isDirectory('/run/fips')) {
    return '/run/fips/control.sock'
  }
  const xdgRuntimeDir = process.env.XDG_RUNTIME_DIR
  if (xdgRuntimeDir && isDirectory(xdgRuntimeDir)) {
    return path.join(xdgRuntimeDir, 'fips', 'control.sock')
  }
  return '/tmp/fips-control.sock'
}

function isDirectory(p: string) {
  try {
    return statSync(p).isDirectory()
  } catch {
    return false
  }
}

/**
 * The control socket speaks line-delimited JSON: one request object, one
 * response object, then the daemon closes the connection.
 */
function request(command: string, params: Record<string, unknown> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ path: resolveControlSocketPath() })
    let buffer = ''
    let settled = false

    const finish = (error: Error | null, data?: any) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socket.destroy()
      if (error) reject(error)
      else resolve(data)
    }

    const timer = setTimeout(
      () => finish(new Error('Timed out talking to the fips control socket.')),
      REQUEST_TIMEOUT
    )

    const handleLine = (line: string) => {
      let message: { status?: string; data?: any; message?: string }
      try {
        message = JSON.parse(line)
      } catch {
        return finish(new Error('Received malformed JSON from the fips control socket.'))
      }
      if (message.status !== 'ok') {
        return finish(new Error(message.message ?? `fips command '${command}' failed.`))
      }
      finish(null, message.data)
    }

    socket.on('connect', () => socket.write(JSON.stringify({ command, params }) + '\n'))
    socket.on('data', (chunk) => {
      buffer += chunk.toString()
      const newlineIndex = buffer.indexOf('\n')
      if (newlineIndex >= 0) {
        handleLine(buffer.slice(0, newlineIndex))
      }
    })
    socket.on('end', () => {
      if (buffer.trim()) handleLine(buffer.trim())
      else finish(new Error('The fips control socket closed without responding.'))
    })
    socket.on('error', (error) => finish(error))
  })
}

/**
 * Returns null when the daemon is not reachable -- that is the normal "fips
 * isn't running" case, not an error worth surfacing as a failure.
 */
export async function showStatus(): Promise<TFipsNodeStatus | null> {
  try {
    const data = await request('show_status')
    return {
      npub: data.npub,
      nodeAddr: data.node_addr,
      meshAddress: data.ipv6_addr,
      tunName: data.tun_name ?? null,
      tunActive: data.tun_state === 'active',
      version: data.version,
      peerCount: data.peer_count ?? 0
    }
  } catch {
    return null
  }
}
