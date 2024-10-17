export default function Titlebar(): JSX.Element {
  return (
    <>
      {window.electron.process.platform === 'darwin' ? (
        <div className="titlebar h-9 fixed top-0 left-0 right-0" />
      ) : null}
    </>
  )
}
