import { Event } from '@nostr-relay/common'
import { useEffect, useState } from 'react'
import Comment from './Comment'

export default function CommentList({ event }: { event: Event }) {
  const [comments, setComments] = useState<Event[]>([])

  const init = async () => {
    const comments = await window.api.relay.findEvents({
      '#e': [event.id],
      kinds: [1],
      limit: 1000
    })
    setComments(comments.reverse())
  }
  useEffect(() => {
    init()
  }, [])

  return (
    <div className="space-y-2">
      {comments.map((comment) => {
        const parentCommentId = comment.tags.find(
          ([tagName, , , type]) => tagName === 'e' && type === 'reply'
        )?.[1]
        const parentComment = parentCommentId
          ? comments.find((c) => c.id === parentCommentId)
          : undefined
        return <Comment key={comment.id} comment={comment} parentComment={parentComment} />
      })}
    </div>
  )
}
