import AppearanceOption from './components/AppearanceOption'
import AutoLaunchOption from './components/AutoLaunchOption'
import DefaultFilterLimitOption from './components/DefaultFilterLimitOption'
import JoinTrayHubOption from './components/JoinTrayHubOption'
import MaxPayloadOption from './components/MaxPayloadOption'
import PowDifficultyOption from './components/PowDifficultyOption'
import TrayIconColorOption from './components/TrayIconColorOption'

export default function Settings() {
  return (
    <div className="space-y-8">
      <AutoLaunchOption />
      <AppearanceOption />
      <TrayIconColorOption />
      <MaxPayloadOption />
      <DefaultFilterLimitOption />
      <PowDifficultyOption />
      <JoinTrayHubOption />
    </div>
  )
}
