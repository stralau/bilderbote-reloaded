import sharp, {Metadata} from "sharp";

export interface ImageScaler {
  scale(image: Blob): Promise<Blob>
}

class DefaultImageScaler implements ImageScaler {
  constructor(private readonly fileSize: number, private readonly scaleDimensions: (buffer: Buffer, md: Metadata) => Promise<{buffer: Buffer, counter: number}>) {
  }

  public async scale(image: Blob): Promise<Blob> {
    let type = image.type
    let buffer: Buffer = Buffer.from(await image.arrayBuffer())

    let scaleResult = await this.scaleDimensions(buffer, await sharp(buffer).metadata())
    let counter = scaleResult.counter

    if(counter > 0) {
      const md = await sharp(buffer).metadata()
      console.log(`Resized to ${md.width}x${md.height}, ${buffer.byteLength} bytes.`)
    }

    const {scaled, numScaled} = await scaleFileSize(scaleResult.buffer, 16 * 1024 * 1024)
    counter += numScaled
    if (counter > 0) {
      console.log(`Scaled ${counter} time(s).`)
      type = 'image/jpeg'
    }
    return new Blob([new Uint8Array(scaled)], {type: type})

  }
}

export const mastodonImageScaler = new DefaultImageScaler(16 * 1024 * 1024, mastodonScaleFileSize)
export const blueskyImageScaler = new DefaultImageScaler(976_560, blueskyScaleFileSize)

async function mastodonScaleFileSize(buffer: Buffer, md: Metadata): Promise<{buffer: Buffer, counter: number}> {
  let counter = 0
  if (md.width * md.height > 8_388_608) {
    const ratio = Math.sqrt(8_388_608 / (md.width * md.height))
    const width = Math.floor(md.width * ratio);

    console.log(`Image is too large: ${md.width}x${md.height}, ${buffer.byteLength} bytes. Resizing to width ${width}.`)

    buffer = await sharp(buffer)
      .resize({width: width, fit: 'inside', withoutEnlargement: true})
      .jpeg({quality: 90, mozjpeg: true})
      .toBuffer()

    counter++
  }
  return {buffer: buffer, counter: counter}
}

async function blueskyScaleFileSize(buffer: Buffer, md: Metadata): Promise<{buffer: Buffer, counter: number}> {
  let counter = 0
  if (md.width > 1000 || md.height > 1000) {
    console.log(`Image is too large: ${md.width}x${md.height}, ${buffer.byteLength} bytes. Resizing dimensions.`)
    buffer = await sharp(buffer)
      .resize(1000, 1000, {fit: 'inside', withoutEnlargement: true})
      .jpeg({quality: 90, mozjpeg: true})
      .toBuffer()

    counter++
  }

  return {buffer: buffer, counter: counter}
}

async function scaleFileSize(buffer: Buffer, maxSizeBytes: number): Promise<{scaled: Buffer, numScaled: number}> {
  let counter = 0

  async function shrink(image: Buffer, quality: number, counter: number): Promise<{ image: Buffer, numScaled: number }> {
    if (image.byteLength <= maxSizeBytes) return {image: image, numScaled: counter}

    if (quality < 5) throw new Error(`Image still too large (${image.byteLength} bytes) after reducing quality to minimum`)

    console.log(`Image is too large: ${image.byteLength} bytes`)

    return shrink(await sharp(image).jpeg({quality: quality, mozjpeg: true}).toBuffer(), quality - 5, counter + 1)
  }

  const result = await shrink(buffer, 90, counter)

  return {scaled: result.image, numScaled: counter}
}
