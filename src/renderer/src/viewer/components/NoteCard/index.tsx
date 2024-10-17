import { Event } from '@nostr-relay/common'
import { Card } from '@renderer/components/ui/card'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Separator } from '@renderer/components/ui/separator'
import { useState } from 'react'
import { Drawer } from 'vaul'
import CommentList from '../CommentList'
import Note from '../Note'

export default function NoteCard({ event, className = '' }: { event: Event; className?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Drawer.Root direction="right" dismissible={false} open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger className={className} onClick={(e) => e.stopPropagation()}>
        <Card className="p-4 hover:bg-muted/50 text-left">
          <Note event={event} />
        </Card>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 bg-black/60 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(false)
          }}
        />
        <Drawer.Content
          className="right-2 top-2 bottom-2 fixed z-10 outline-none w-7/12 flex"
          // The gap between the edge of the screen and the drawer is 8px in this case.
          style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}
        >
          <ScrollArea className="bg-background h-full w-full grow flex flex-col rounded-xl select-text">
            <div className="p-4">
              <Note event={event} />
              <Separator className="my-4" />
              <CommentList className="pl-4" event={event} />
            </div>
          </ScrollArea>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
