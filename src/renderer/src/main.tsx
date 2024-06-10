import './assets/main.css'

import App from '@renderer/App'
import Data from '@renderer/pages/data'
import Home from '@renderer/pages/home'
import Restrictions from '@renderer/pages/restrictions'
import RuleEditor from '@renderer/pages/rule-editor'
import Settings from '@renderer/pages/settings'
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
      { path: '/restrictions', element: <Restrictions /> },
      { path: '/restrictions/rule-editor', element: <RuleEditor /> },
      { path: '/restrictions/rule-editor/:id', element: <RuleEditor /> },
      { path: '/settings', element: <Settings /> }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
