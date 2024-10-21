import { isMacOS } from '@renderer/lib/platform'
import { Titlebar } from '../components/Titlebar'

export default function LeftTitlebar() {
  return <Titlebar className={isMacOS() ? 'pl-20' : ''}></Titlebar>
}
