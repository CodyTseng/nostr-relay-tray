import { NavLink, Outlet } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/toaster'

const navItems = [
  {
    title: 'Home',
    href: '/'
  },
  {
    title: 'Feed',
    href: '/feed'
  },
  {
    title: 'Data',
    href: '/data'
  },
  {
    title: 'WoT & PoW',
    href: '/wotandpow'
  },
  {
    title: 'Rules',
    href: '/rules'
  },
  {
    title: 'Logs',
    href: '/logs'
  },
  {
    title: 'Settings',
    href: '/settings'
  }
]

function App(): JSX.Element {
  return (
    <div className="h-screen">
      <ThemeProvider>
        <Titlebar />
        <div className="flex">
          <nav
            className={`flex-shrink-0 w-36 pt-4 pl-6 sticky h-full ${window.electron.process.platform === 'darwin' ? 'top-9' : 'top-4'}`}
          >
            <ul className="space-y-1">
              {navItems.map(({ title, href }) => (
                <li key={href}>
                  <NavLink
                    to={href}
                    className={({ isActive }) =>
                      (isActive ? 'text-foreground font-bold' : 'text-muted-foreground') +
                      ' hover:underline'
                    }
                  >
                    {title}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div
            className={`flex-1 w-0 h-screen  ${window.electron.process.platform === 'darwin' ? 'pt-9' : 'pt-4'}`}
          >
            <Outlet />
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    </div>
  )
}

export default App

function Titlebar(): JSX.Element {
  return (
    <>
      {window.electron.process.platform === 'darwin' ? (
        <div className="titlebar h-9 fixed top-0 left-0 right-0" />
      ) : null}
    </>
  )
}
