import { cn } from '@renderer/lib/utils'

export default function VideoPlayer({ src, className }: { src: string; className?: string }) {
  return <video controls className={cn('rounded-lg max-h-80', className)} src={src} />
}
