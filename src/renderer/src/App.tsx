import { NavLink, Outlet } from 'react-router-dom'

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
      <div className="titlebar h-9" />
      <div className="flex">
        <nav className="flex-shrink-0 w-36 pt-4 pl-6">
          <ul className="space-y-1">
            {navItems.map(({ title, href }) => (
              <li key={href}>
                <NavLink
                  to={href}
                  className={({ isActive }) =>
                    (isActive ? 'text-black font-bold' : 'text-gray-400') + ' hover:underline'
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
    </>
  )
}

export default App
