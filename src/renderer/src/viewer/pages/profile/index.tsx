import NoteList from '@renderer/viewer/components/NoteList'
import { nip19 } from 'nostr-tools'
import { useParams } from 'react-router-dom'

export default function Profile() {
  const params = useParams<{ user_id: string }>()
  const userId = params.user_id

  let pubkey: string | null = null
  if (!userId) {
    return
  } else if (/^npub1[a-z0-9]{58}$/.test(userId)) {
    const { data } = nip19.decode(userId as `npub1${string}`)
    pubkey = data
  } else if (/^[0-9a-f]{64}$/.test(userId)) {
    pubkey = userId
  }

  return <div className="h-full">{pubkey && <NoteList filter={{ authors: [pubkey] }} />}</div>
}
