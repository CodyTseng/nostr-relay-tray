import dayjs from 'dayjs'

export function formatTimestamp(timestamp: number) {
  const time = dayjs(timestamp * 1000)
  const now = dayjs()
  const diff = now.diff(time, 'day')
  if (diff > 1) {
    return `${diff} days ago`
  }

  const diffHour = now.diff(time, 'hour')
  if (diffHour > 1) {
    return `${diffHour} hours ago`
  }

  const diffMinute = now.diff(time, 'minute')
  if (diffMinute > 1) {
    return `${diffMinute} minutes ago`
  }

  return 'just now'
}
