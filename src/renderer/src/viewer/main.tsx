import '../assets/main.css'

import { ThemeProvider } from '@renderer/components/theme-provider'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@renderer/components/ui/resizable'
import { Toaster } from '@renderer/components/ui/toaster'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createHashRouter, useLocation } from 'react-router-dom'
import Left from './Left'
import Right from './Right'
import NotePage from './pages/NotePage'
import ProfilePage from './pages/ProfilePage'
import Titlebar from './components/Titlebar'

export const router = createHashRouter([
  {
    path: '/',
    element: <Viewer />,
    children: [
      { index: true, element: <div /> },
      { path: '/profile/:id', element: <ProfilePage /> },
      { path: '/note/:id', element: <NotePage /> }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)

function Viewer(): JSX.Element {
  const location = useLocation()

  return (
    <div className="h-screen">
      <ThemeProvider>
        <Titlebar />
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel minSize={30}>
            <Left />
          </ResizablePanel>
          {location.pathname === '/' ? null : (
            <>
              <ResizableHandle />
              <ResizablePanel minSize={30}>
                <Right />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
        <Toaster />
      </ThemeProvider>
    </div>
  )
}
