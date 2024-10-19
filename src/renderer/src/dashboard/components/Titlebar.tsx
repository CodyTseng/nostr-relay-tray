import { isMacOS } from '@renderer/lib/platform'

export default function Titlebar(): JSX.Element {
  return <>{isMacOS() ? <div className="draggable h-9 fixed top-0 left-0 right-0" /> : null}</>
}
