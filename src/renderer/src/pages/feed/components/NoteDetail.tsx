import { Event } from '@nostr-relay/common'
import { Drawer } from 'vaul'
import Note from './Note'
import { Separator } from '@renderer/components/ui/separator'
import CommentList from './CommentList'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Card } from '@renderer/components/ui/card'

export default function NoteDetail({
  event,
  className = ''
}: {
  event: Event
  className?: string
}) {
  return (
    <Drawer.Root direction="right">
      <Drawer.Trigger className={className}>
        <Card className="p-4 mb-4 hover:bg-muted">
          <Note event={event} />
        </Card>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 cursor-pointer" />
        <Drawer.Content
          className="right-2 top-2 bottom-2 fixed z-10 outline-none w-7/12 flex"
          // The gap between the edge of the screen and the drawer is 8px in this case.
          style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}
        >
          <ScrollArea className="bg-background h-full w-full grow flex flex-col rounded-xl">
            <div className="p-4">
              <Note event={event} />
              <Separator className="my-4" />
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
