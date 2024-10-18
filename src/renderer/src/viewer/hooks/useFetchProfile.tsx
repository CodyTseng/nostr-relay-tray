import { formatPubkey } from '@renderer/lib/pubkey'
import { nip19 } from 'nostr-tools'
import { useEffect, useState } from 'react'

export default function useFetchProfile(id?: string) {
  const [pubkey, setPubkey] = useState<string | null>(null)
  const [profile, setProfile] = useState<{
    banner?: string
    avatar?: string
    username?: string
    nip05?: string
    about?: string
  }>({})

  useEffect(() => {
    const decodeUserId = async () => {
      if (!id) {
        return
      } else if (/^npub1[a-z0-9]{58}$/.test(id)) {
        const { data } = nip19.decode(id as `npub1${string}`)
        setPubkey(data)
      } else if (/^[0-9a-f]{64}$/.test(id)) {
        setPubkey(id)
      }
    }

    decodeUserId()
  }, [id])

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
        setProfile({
          banner: profile.banner,
          avatar: profile.picture,
          username: profile.display_name ?? profile.name ?? formatPubkey(pubkey),
          nip05: profile.nip05,
          about: profile.about
        })
      } catch {
        // ignore
      }
    }

    fetchProfile()
  }, [pubkey])

  return { ...profile, pubkey, npub: pubkey ? nip19.npubEncode(pubkey) : undefined }
}
