import { NavLink, Outlet } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/toaster'

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
    title: 'Settings',
    href: '/settings'
  }
]

function App(): JSX.Element {
  return (
    <>
      <ThemeProvider>
        <Titlebar />
        <div className="flex">
          <nav className="flex-shrink-0 w-36 pt-4 pl-6">
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
          <div className="flex-1 pr-7">
            <Outlet />
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
        <div className="titlebar h-9" />
      ) : (
        <div className="h-4" />
      )}
    </>
  )
}
