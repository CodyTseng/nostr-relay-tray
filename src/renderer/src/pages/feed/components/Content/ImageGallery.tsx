export default function ImageGallery({ images }: { images: string[] }) {
  return (
    <div className="flex mt-2 gap-2">
      {images.map((url, index) => (
        <img key={index} src={url} className="w-64 object-cover" />
      ))}
    </div>
  )
}
