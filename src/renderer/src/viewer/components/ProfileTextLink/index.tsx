import { userIdToPubkey } from '@renderer/lib/pubkey'
import { toProfile } from '@renderer/lib/url'
import { cn } from '@renderer/lib/utils'
import { useNavigate } from 'react-router-dom'

export default function ProfileTextLink({
  children,
  userId,
  className
}: {
  children: React.ReactNode
  userId: string
  className?: string
}) {
  const navigate = useNavigate()
  const pubkey = userIdToPubkey(userId)

  return (
    <div
      className={cn('font-semibold truncate hover:underline cursor-pointer', className)}
      onClick={(e) => {
        e.stopPropagation()
        navigate(toProfile(pubkey))
      }}
    >
      {children}
    </div>
  )
}
