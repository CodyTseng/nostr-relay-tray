import { Link } from 'react-router-dom'

function NormalUrl({ url }: { url: string }) {
  return (
    <Link
      className="text-highlight hover:underline"
      to={url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      {url}
    </Link>
  )
}
export default function renderNormalUrl(url: string, index: number) {
  return <NormalUrl key={`normal-url-${index}`} url={url} />
}
