import reactStringReplace from 'react-string-replace'

export function parseContent(content: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const urls = content.match(urlRegex) || []

  let c = content
  const images: string[] = []

  urls.forEach((url) => {
    if (isImage(url)) {
      c = c.replace(url, '')
      images.push(url)
    }
  })

  return { contentElement: <ContentElement text={c.trim()} />, images }
}

function isImage(url: string) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  return imageExtensions.some((ext) => new URL(url).pathname.toLowerCase().endsWith(ext))
}

function ContentElement({ text }: { text: string }) {
  let nodes: React.ReactNode[] = [text]

  // Match URLs
  nodes = reactStringReplace(nodes, /(https?:\/\/\S+)/g, (match, i) => (
    <a key={match + i} href={match} className="text-blue-500 hover:underline">
      {match}
    </a>
  ))

  // Match hashtags
  nodes = reactStringReplace(nodes, /#(\w+)/g, (match, i) => (
    <span key={match + i} className="text-violet-500 hover:underline">
      #{match}
    </span>
  ))

  return <div>{nodes}</div>
}
