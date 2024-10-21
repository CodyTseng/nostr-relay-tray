import { userIdToPubkey } from '@renderer/lib/pubkey'
import { toProfile } from '@renderer/lib/url'
import { cn } from '@renderer/lib/utils'
import { Link } from 'react-router-dom'

export default function Username({
  userId,
  username,
  showAt = false,
  className
}: {
  userId: string
  username: string
  showAt?: boolean
  className?: string
}) {
  const pubkey = userIdToPubkey(userId)

  return (
    <Link
      to={toProfile(pubkey)}
      className={cn('font-semibold truncate hover:underline cursor-pointer', className)}
      onClick={(e) => e.stopPropagation()}
    >
      {showAt && '@'}
      {username}
    </Link>
  )
}
