import { Separator } from '@renderer/components/ui/separator'
import { formatNpub, generateImageByPubkey } from '@renderer/lib/pubkey'
import Nip05 from '@renderer/viewer/components/Nip05'
import NoteList from '@renderer/viewer/components/NoteList'
import ProfileAbout from '@renderer/viewer/components/ProfileAbout'
import UserAvatar from '@renderer/viewer/components/UserAvatar'
import { useFetchProfile } from '@renderer/viewer/hooks'
import { Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function ProfilePage() {
  const params = useParams<{ id: string }>()
  const { banner, avatar = '', username, nip05, about, pubkey, npub } = useFetchProfile(params.id)
  const [copied, setCopied] = useState(false)

  if (!pubkey || !npub) return null

  const copyNpub = () => {
    if (!npub) return
    navigator.clipboard.writeText(npub)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="relative bg-cover bg-center w-full aspect-[21/9] rounded-lg mb-12">
        <ProfileBanner
          banner={banner}
          pubkey={pubkey}
          className="w-full h-full object-cover rounded-lg"
        />
        <UserAvatar
          avatar={avatar}
          userId={pubkey}
          className="absolute bottom-0 left-4 translate-y-1/2 w-24 h-24 border-4 border-background"
        />
      </div>
      <div className="px-4 space-y-1">
        <div className="text-xl font-semibold">{username}</div>
        {nip05 && <Nip05 nip05={nip05} pubkey={pubkey} />}
        <div
          className="flex gap-2 text-sm text-muted-foreground items-center bg-muted w-fit px-2 rounded-full hover:text-foreground cursor-pointer"
          onClick={() => copyNpub()}
        >
          {copied ? (
            <div>Copied!</div>
          ) : (
            <>
              <div>{formatNpub(npub, 24)}</div>
              <Copy size={14} />
            </>
          )}
        </div>
        <div className="text-sm text-wrap break-words whitespace-pre-wrap">
          <ProfileAbout about={about} />
        </div>
      </div>
      <Separator className="my-4" />
      <NoteList key={pubkey} filter={{ authors: [pubkey] }} />
    </div>
  )
}

function ProfileBanner({
  banner,
  pubkey,
  className
}: {
  banner?: string
  pubkey: string
  className?: string
}) {
  const defaultBanner = generateImageByPubkey(pubkey)
  const [bannerUrl, setBannerUrl] = useState(banner || defaultBanner)

  useEffect(() => {
    if (banner) {
      setBannerUrl(banner)
    } else {
      setBannerUrl(defaultBanner)
    }
  }, [pubkey, banner])

  return (
    <img
      src={bannerUrl}
      alt="Banner"
      className={className}
      onError={() => setBannerUrl(defaultBanner)}
    />
  )
}
