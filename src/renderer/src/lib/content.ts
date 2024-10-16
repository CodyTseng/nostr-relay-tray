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

  return { content: c.trim(), images }
}

function isImage(url: string) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  return imageExtensions.some((ext) => new URL(url).pathname.toLowerCase().endsWith(ext))
}
