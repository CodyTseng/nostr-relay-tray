import '../assets/main.css'

import { ThemeProvider } from '@renderer/components/theme-provider'
import Titlebar from '@renderer/components/Titlebar'
import { Toaster } from '@renderer/components/ui/toaster'
import Notes from '@renderer/viewer/pages/notes'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createHashRouter, NavLink, Outlet, RouterProvider } from 'react-router-dom'
import Profile from './pages/profile'

const navItems = [
  {
    title: 'Notes',
    href: '/'
  }
]

export const router = createHashRouter([
  {
    path: '/',
    element: <Viewer />,
    children: [
      { index: true, element: <Notes /> },
      { path: 'profile/:id', element: <Profile /> }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)

function Viewer(): JSX.Element {
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
