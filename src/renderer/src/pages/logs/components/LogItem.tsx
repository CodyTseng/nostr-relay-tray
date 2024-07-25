import { TLog } from '@common/types'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@renderer/components/ui/accordion'
import dayjs from 'dayjs'

export default function LogItem({ log }: { log: TLog }) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1" className="border-none">
        <AccordionTrigger className="py-0.5">
          <div className="flex space-x-2 items-center">
            <div className="text-muted-foreground">
              {dayjs(log.timestamp).format('MMM DD HH:mm:ss')}
            </div>
            <div>{log.message}</div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="py-0.5 text-muted-foreground">
          {JSON.stringify(log.data, null, 1)}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
