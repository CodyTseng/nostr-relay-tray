import '../assets/main.css'

import { ThemeProvider } from '@renderer/components/theme-provider'
import { Toaster } from '@renderer/components/ui/toaster'
import Data from '@renderer/dashboard/pages/data'
import Home from '@renderer/dashboard/pages/home'
import Logs from '@renderer/dashboard/pages/logs'
import Rules from '@renderer/dashboard/pages/rules'
import EditRule from '@renderer/dashboard/pages/rules/edit'
import Settings from '@renderer/dashboard/pages/settings'
import WotAndPow from '@renderer/dashboard/pages/wotAndPow'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createHashRouter, NavLink, Outlet, RouterProvider } from 'react-router-dom'
import Titlebar from './components/Titlebar'

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

export const router = createHashRouter([
  {
    path: '/',
    element: <Dashboard />,
    children: [
      { index: true, element: <Home /> },
      { path: '/data', element: <Data /> },
      { path: '/wotandpow', element: <WotAndPow /> },
      { path: '/rules', element: <Rules /> },
      { path: '/rules/create', element: <EditRule /> },
      { path: '/rules/:id/edit', element: <EditRule /> },
      { path: '/logs', element: <Logs /> },
      { path: '/settings', element: <Settings /> }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)

function Dashboard(): JSX.Element {
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
