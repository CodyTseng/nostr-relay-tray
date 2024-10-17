function Hashtag({ hashtag }: { hashtag: string }) {
  return <span className="text-highlight">#{hashtag}</span>
}

export default function renderHashtag(hashtag: string, index: number) {
  return <Hashtag key={`hashtag-${index}`} hashtag={hashtag} />
}
