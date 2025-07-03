import { PROXY_CONNECTION_STATUS, TProxyConnectionStatus } from '@common/constants'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/toaster'
import { cn } from './lib/utils'

function App(): JSX.Element {
  const navigate = useNavigate()
  const [proxyStatus, setProxyStatus] = useState<TProxyConnectionStatus>(
    PROXY_CONNECTION_STATUS.DISCONNECTED
  )

  useEffect(() => {
    const navigateListener = (_, path: string) => {
      navigate(path)
    }
    window.api.app.onNavigate(navigateListener)

    window.api.proxy.currentStatus().then((status) => {
      setProxyStatus(status)
    })
    const proxyStatusChangeListener = (_, status: TProxyConnectionStatus) => {
      setProxyStatus(status)
    }
    window.api.proxy.onStatusChange(proxyStatusChangeListener)
    return () => {
      window.api.app.removeNavigateListener(navigateListener)
      window.api.proxy.removeStatusChangeListener(proxyStatusChangeListener)
    }
  }, [])

  const navItems = [
    {
      title: 'Home',
      href: '/'
    },
    {
      title: 'Data',
      href: '/data'
    },
    {
      title: 'Rules',
      href: '/rules'
    },
    {
      title: 'WoT & PoW',
      href: '/wotandpow'
    },
    {
      title: 'Logs',
      href: '/logs'
    },
    {
      title: (
        <div className="flex gap-2 items-center">
          Proxy
          {proxyStatus !== PROXY_CONNECTION_STATUS.DISCONNECTED && (
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                proxyStatus === PROXY_CONNECTION_STATUS.CONNECTED ? 'bg-green-400' : 'bg-orange-400'
              )}
            />
          )}
        </div>
      ),
      href: '/proxy'
    },
    {
      title: 'Settings',
      href: '/settings'
    }
  ]

  return (
    <>
      <ThemeProvider>
        <div className="flex flex-col h-screen">
          <Titlebar />
          <div className="flex flex-1 h-0">
            <nav className="flex-shrink-0 w-44 pt-4 pl-6">
              <ul className="space-y-2">
                {navItems.map(({ title, href }) => (
                  <li key={href}>
                    <NavLink
                      to={href}
                      className={({ isActive }) =>
                        (isActive ? 'text-foreground' : 'text-muted-foreground/60') +
                        ' hover:underline font-semibold'
                      }
                    >
                      {title}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex-1 w-0 pr-6">
              <Outlet />
            </div>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    </>
  )
}

export default App

function Titlebar(): JSX.Element {
  return (
    <>
      {window.electron.process.platform === 'darwin' ? (
        <div className="titlebar h-9 shrink-0" />
      ) : (
        <div className="h-4 shrink-0" />
      )}
    </>
  )
}
