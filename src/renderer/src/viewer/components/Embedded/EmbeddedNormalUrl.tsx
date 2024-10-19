import { Link } from 'react-router-dom'

export function EmbeddedNormalUrl({ url }: { url: string }) {
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
