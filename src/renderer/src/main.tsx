import './assets/main.css'

import App from '@renderer/App'
import Data from '@renderer/pages/data'
import Home from '@renderer/pages/home'
import Logs from '@renderer/pages/logs'
import Rules from '@renderer/pages/rules'
import EditRule from '@renderer/pages/rules/edit'
import Settings from '@renderer/pages/settings'
import WotAndPow from '@renderer/pages/wotAndPow'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
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
