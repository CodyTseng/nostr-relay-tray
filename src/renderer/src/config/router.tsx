import App from '@renderer/App'
import Data from '@renderer/pages/data'
import Home from '@renderer/pages/home'
import Settings from '@renderer/pages/settings'
import { createHashRouter } from 'react-router-dom'

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: '/data', element: <Data /> },
      { path: '/settings', element: <Settings /> }
    ]
  }
])
