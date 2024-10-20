import { useEffect, useState } from 'react'
import { Photo, RowsPhotoAlbum } from 'react-photo-album'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'

export default function ImageGallery({
  className,
  images
}: {
  className?: string
  images: string[]
}) {
  const [slideMap, setSlideMap] = useState<Record<string, Photo>>({})
  const [index, setIndex] = useState(-1)

  useEffect(() => {
    const initSlideMap = async () => {
      await Promise.all(
        images.map(async (image) => {
          try {
            const size = await getImageSize(image)
            setSlideMap((pre) => ({ ...pre, [image]: { src: image, ...size } }))
          } catch {
            // ignore
          }
        })
      )
    }
    initSlideMap()
  }, [images])

  const slides = Object.values(slideMap)

  const handlePhotoClick = (event: React.MouseEvent, current: number) => {
    event.preventDefault()
    setIndex(current)
  }

  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      <RowsPhotoAlbum
        photos={slides}
        targetRowHeight={150}
        onClick={({ index: current, event }) => handlePhotoClick(event, current)}
        rowConstraints={{ singleRowMaxHeight: 300 }}
        render={{
          image: ({ src, width, height }) => (
            <img className="rounded-lg" src={src} width={width} height={height} />
          )
        }}
      />
      <Lightbox
        index={index}
        slides={slides}
        plugins={[Zoom]}
        open={index >= 0}
        close={() => setIndex(-1)}
        controller={{ closeOnBackdropClick: true, closeOnPullUp: true, closeOnPullDown: true }}
        styles={{ toolbar: { paddingTop: '2.25rem' } }}
      />
    </div>
  )
}

function getImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((res, rej) => {
    const image = new Image()
    image.src = src

    image.onload = () => {
      const size = { width: image.width, height: image.height }
      res(size)
    }
    image.onerror = () => rej(new Error('Failed to get image size'))
  })
}
