import { Avatar, AvatarFallback, AvatarImage } from '@renderer/components/ui/avatar'
import { userIdToPubkey } from '@renderer/lib/pubkey'
import { toProfile } from '@renderer/lib/url'
import { Link } from 'react-router-dom'

export default function UserAvatar({
  avatar,
  userId,
  className
}: {
  avatar: string
  userId: string
  className?: string
}) {
  const pubkey = userIdToPubkey(userId)

  return (
    <Link to={toProfile(pubkey)} onClick={(e) => e.stopPropagation()}>
      <Avatar className={className}>
        <AvatarImage src={avatar} />
        <AvatarFallback>{pubkey}</AvatarFallback>
      </Avatar>
    </Link>
  )
}
