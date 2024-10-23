import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { isMacOS } from '@renderer/lib/platform'
import { useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import RightTitlebar from './RightTitlebar'

export default function Right() {
  const location = useLocation()
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    const handleScroll = () => {
      history.replaceState({ ...history.state, scrollY: scrollArea.scrollTop }, '')
    }

    scrollArea.addEventListener('scroll', handleScroll)

    // Restore scroll position if available
    if (history.state && history.state.scrollY !== undefined) {
      setTimeout(() => {
        scrollArea.scrollTop = history.state.scrollY
      }, 100)
    }

    return () => {
      scrollArea.removeEventListener('scroll', handleScroll)
    }
  }, [location])

  return (
    <>
      <ScrollArea
        ref={scrollAreaRef}
        className="h-full"
        scrollBarClassName={isMacOS() ? 'pt-9' : 'pt-4'}
      >
        <RightTitlebar />
        <div className="px-4 pb-4 pt-[52px]">
          <Outlet />
        </div>
      </ScrollArea>
    </>
  )
}
