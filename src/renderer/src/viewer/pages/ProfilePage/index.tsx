import NoteList from '@renderer/viewer/components/NoteList'
import { nip19 } from 'nostr-tools'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function ProfilePage() {
  const params = useParams<{ id: string }>()
  const userId = params.id

  const [pubkey, setPubkey] = useState<string | null>(null)
  const [profile, setProfile] = useState<{
    banner?: string
    picture?: string
    nip05?: string
    display_name?: string
    name?: string
    about?: string
  } | null>(null)

  useEffect(() => {
    const decodeUserId = async () => {
      if (!userId) {
        return
      } else if (/^npub1[a-z0-9]{58}$/.test(userId)) {
        const { data } = nip19.decode(userId as `npub1${string}`)
        setPubkey(data)
      } else if (/^[0-9a-f]{64}$/.test(userId)) {
        setPubkey(userId)
      }
    }

    decodeUserId()
  }, [userId])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!pubkey) return

      const [profileEvent] = await window.api.relay.findEvents({
        authors: [pubkey],
        kinds: [0],
        limit: 1
      })
      if (!profileEvent) return

      try {
        const profile = JSON.parse(profileEvent.content)
        setProfile(profile)
      } catch {
        // ignore
      }
    }

    fetchProfile()
  }, [pubkey])

  return (
    <div>
      <div
        className="bg-cover bg-center w-full aspect-[16/9] rounded-lg mb-4"
        style={{ backgroundImage: `url(${profile?.banner ?? ''})` }}
      />
      {pubkey ? (
        <NoteList key={JSON.stringify({ authors: [pubkey] })} filter={{ authors: [pubkey] }} />
      ) : null}
    </div>
  )
}
