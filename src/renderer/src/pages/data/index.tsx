import ClearAllEvents from './ClearAllEvents'
import DeleteEventsByFilter from './DeleteEventsByFilter'
import ExportEvents from './ExportEvents'
import ImportEvents from './ImportEvents'

export default function Data(): JSX.Element {
  return (
    <div className="space-y-4">
      <ExportEvents />
      <ImportEvents />
      <DeleteEventsByFilter />
      <ClearAllEvents />
    </div>
  )
}
