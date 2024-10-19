import { useFetchNip05 } from '@renderer/viewer/hooks/useFetchNip05'
import { BadgeAlert, BadgeCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Nip05({ nip05, pubkey }: { nip05: string; pubkey: string }) {
  const { nip05IsVerified, nip05Name, nip05Domain } = useFetchNip05(nip05, pubkey)
  return (
    <div className="flex items-center space-x-1">
      {nip05Name !== '_' ? <div className="text-sm text-muted-foreground">@{nip05Name}</div> : null}
      <Link
        to={`https://${nip05Domain}`}
        target="_blank"
        className={`flex items-center space-x-1 hover:underline ${nip05IsVerified ? 'text-highlight' : 'text-muted-foreground'}`}
      >
        {nip05IsVerified ? <BadgeCheck size={16} /> : <BadgeAlert size={16} />}
        <div className="text-sm">{nip05Domain}</div>
      </Link>
    </div>
  )
}
