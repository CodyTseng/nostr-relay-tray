import { Avatar, AvatarFallback, AvatarImage } from '@renderer/components/ui/avatar'
import { userIdToPubkey } from '@renderer/lib/pubkey'
import { toProfile } from '@renderer/lib/url'
import { cn } from '@renderer/lib/utils'
import { useNavigate } from 'react-router-dom'

export default function ProfileAvatarLink({
  avatar,
  userId,
  className
}: {
  avatar: string
  userId: string
  className?: string
}) {
  const navigate = useNavigate()
  const pubkey = userIdToPubkey(userId)

  return (
    <Avatar
      className={cn('cursor-pointer', className)}
      onClick={(e) => {
        e.stopPropagation()
        navigate(toProfile(pubkey))
      }}
    >
      <AvatarImage src={avatar} />
      <AvatarFallback>{pubkey}</AvatarFallback>
    </Avatar>
  )
}
