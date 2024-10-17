import { Link } from 'react-router-dom'

function NormalUrl({ url }: { url: string }) {
  return (
    <Link className="text-blue-500 hover:underline" to={url} target="_blank" rel="noreferrer">
      {url}
    </Link>
  )
}
export default function renderNormalUrl(url: string, index: number) {
  return <NormalUrl key={`normal-url-${index}`} url={url} />
}
