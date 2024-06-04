import App from '@renderer/App'
import Data from '@renderer/pages/data'
import Home from '@renderer/pages/home'
import RestrictionEditor from '@renderer/pages/restriction-editor'
import Restrictions from '@renderer/pages/restrictions'
import Settings from '@renderer/pages/settings'
import { createHashRouter } from 'react-router-dom'

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: '/data', element: <Data /> },
      { path: '/restrictions', element: <Restrictions /> },
      { path: '/restriction-editor', element: <RestrictionEditor /> },
      { path: '/settings', element: <Settings /> }
    ]
  }
])
