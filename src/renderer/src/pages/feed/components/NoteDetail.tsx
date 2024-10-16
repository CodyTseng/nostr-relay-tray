import { Event } from '@nostr-relay/common'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Drawer } from 'vaul'
import CommentList from './CommentList'
import Note from './Note'
import { useState } from 'react'

export default function NoteDetail({
  event,
  className = ''
}: {
  event: Event
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Drawer.Root direction="right" dismissible={false} open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger className={className}>
        <Note event={event} />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 bg-black/60 cursor-pointer"
          onClick={() => setIsOpen(false)}
        />
        <Drawer.Content
          className="right-2 top-2 bottom-2 fixed z-10 outline-none w-7/12 flex"
          // The gap between the edge of the screen and the drawer is 8px in this case.
          style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}
        >
          <ScrollArea className="bg-background h-full w-full grow flex flex-col rounded-xl select-text">
            <div className="p-4">
              <Note canClick={false} event={event} />
              <div className="pl-4">
                <CommentList event={event} />
              </div>
            </div>
          </ScrollArea>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
