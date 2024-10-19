import { Avatar, AvatarImage } from '@renderer/components/ui/avatar'
import { Separator } from '@renderer/components/ui/separator'
import Nip05 from '@renderer/viewer/components/Nip05'
import NoteList from '@renderer/viewer/components/NoteList'
import ProfileAbout from '@renderer/viewer/components/ProfileAbout'
import { useFetchProfile } from '@renderer/viewer/hooks'
import { useParams } from 'react-router-dom'

export default function ProfilePage() {
  const params = useParams<{ id: string }>()

  const { banner = '', avatar = '', username, nip05, about, pubkey } = useFetchProfile(params.id)

  return (
    <div>
      <div className="relative">
        <div
          className="bg-cover bg-center w-full aspect-[21/9] rounded-lg mb-12"
          style={{ backgroundImage: `url(${banner})` }}
        />
        <Avatar className="absolute bottom-0 left-4 translate-y-1/2 w-24 h-24 border-4 border-background">
          <AvatarImage src={avatar} />
        </Avatar>
      </div>
      <div className="px-4 space-y-1">
        <div className="text-lg font-semibold">{username}</div>
        {nip05 && pubkey && <Nip05 nip05={nip05} pubkey={pubkey} />}
        <div className="text-sm text-wrap break-words whitespace-pre-wrap">
          <ProfileAbout about={about} />
        </div>
      </div>
      <Separator className="my-4" />
      {pubkey ? <NoteList key={pubkey} filter={{ authors: [pubkey] }} /> : null}
    </div>
  )
}
