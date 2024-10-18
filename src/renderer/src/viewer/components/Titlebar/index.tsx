export default function Titlebar({ children }: { children?: React.ReactNode }): JSX.Element {
  return (
    <div className="titlebar fixed top-0 h-9 z-10 w-full bg-background/30 backdrop-blur-sm drop-shadow-sm">
      {children}
    </div>
  )
}
