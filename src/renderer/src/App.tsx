import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Separator } from '@renderer/components/ui/separator'

const navItems = [
  {
    title: 'Home',
    href: '#/'
  },
  {
    title: 'Data',
    href: '#/data'
  },
  {
    title: 'Settings',
    href: '#/settings'
  }
]

function App(): JSX.Element {
  const [active, setActive] = useState('Home')

  const navList = navItems.map(({ title, href }) => {
    return (
      <a href={href} onClick={() => setActive(title)}>
        <div
          className={`py-1 ${title === active ? 'text-black font-bold' : 'text-gray-400'} hover:underline`}
        >
          {title}
        </div>
      </a>
    )
  })
  return (
    <>
      <div className="flex h-screen">
        <div className="flex-shrink-0 w-40 pt-8 pl-8">{navList}</div>
        <Separator orientation="vertical" />
        <div className="flex-1 p-4">
          <Outlet />
        </div>
      </div>
    </>
  )
}

export default App
