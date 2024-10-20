import { toHashtag } from '@renderer/lib/url'
import { Link } from 'react-router-dom'

export function EmbeddedHashtag({ hashtag }: { hashtag: string }) {
  return (
    <Link
      className="text-highlight hover:underline"
      to={toHashtag(hashtag)}
      onClick={(e) => e.stopPropagation()}
    >
      #{hashtag}
    </Link>
  )
}
