import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

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
    title: 'Restrictions',
    href: '/restrictions'
  },
  {
    title: 'Settings',
    href: '/settings'
  }
]

function App(): JSX.Element {
  const [active, setActive] = useState('Home')

  let location = useLocation()
  useEffect(() => {
    const title =
      location.pathname === '/'
        ? 'Home'
        : navItems.find((item) =>
            item.href === '/' ? false : location.pathname.startsWith(item.href)
          )?.title ?? 'Home'
    setActive(title)
  }, [location])

  const navList = navItems.map(({ title, href }) => {
    return (
      <a key={href} href={`#${href}`}>
        <div
          className={`py-1 ${title === active ? 'text-black font-bold' : 'text-gray-400'} hover:underline`}
        >
          {title}
        </div>
      </a>
    )
  })
  return (
    <div className="flex">
      <div className="flex-shrink-0 w-36 pt-7 pl-6">{navList}</div>
      <div className="flex-1 pt-4 pr-6">
        <Outlet />
      </div>
    </div>
  )
}

export default App
