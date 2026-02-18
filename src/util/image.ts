import sharp, {Sharp} from "sharp";
import {Log} from "./log.js";

export interface ImageScaler {
  scale(image: Blob): Promise<Blob>
}

class DefaultImageScaler implements ImageScaler {
  constructor(private readonly fileSize: number, private readonly scaleDimensions: (buffer: Buffer, log: Log) => Promise<{
    buffer: Buffer,
    scaled: boolean
  }>, private readonly log: Log) {
  }

  public async scale(image: Blob): Promise<Blob> {
    let type = image.type
    const scaleResult: {
      buffer: Buffer;
      scaled: boolean
    } = await this.scaleDimensions(Buffer.from(await image.arrayBuffer()), this.log)

    let counter = scaleResult.scaled ? 1 : 0

    const {scaled, numScaled} = await scaleFileSize(scaleResult.buffer, this.fileSize, this.log)

    counter += numScaled

    if (counter > 0) {
      type = 'image/jpeg'

      // Metadata is only recalculated after calling toBuffer(), so we have to fetch it again here
      const md = await sharp(scaled).metadata()

      this.log.log(`Scaled ${counter} time(s). Resized to ${md.width}x${md.height}, ${md.size} bytes.`)
    }

    return new Blob([new Uint8Array(scaled)], {type: type})

  }
}

export const mastodonImageScaler = new DefaultImageScaler(16 * 1024 * 1024, mastodonScaleDimensions, new Log('Mastodon'))
export const blueskyImageScaler = new DefaultImageScaler(976_560, blueskyScaleDimensions, new Log('Bluesky'))

async function mastodonScaleDimensions(buffer: Buffer, log: Log): Promise<{ buffer: Buffer, scaled: boolean }> {
  const s = sharp(buffer)
  const md = await s.metadata()

  if (md.width * md.height <= 8_388_608)
    return {buffer: buffer, scaled: false}

  const ratio = Math.sqrt(8_388_608 / (md.width * md.height))
  const width = Math.floor(md.width * ratio);

  log.log(`Image is too large: ${md.width}x${md.height}, ${md.size} bytes. Resizing to width ${width}.`)

  buffer = await s
    .resize({width: width, fit: 'inside', withoutEnlargement: true})
    .jpeg({quality: 90, mozjpeg: true})
    .toBuffer()

  return {buffer: buffer, scaled: true}
}

async function blueskyScaleDimensions(buffer: Buffer, log: Log): Promise<{ buffer: Buffer, scaled: boolean }> {

  const s = sharp(buffer)
  const md = await s.metadata()

  if (md.width <= 1000 && md.height <= 1000)
    return {buffer: buffer, scaled: false}

  log.log(`Image is too large: ${md.width}x${md.height}, ${md.size} bytes. Resizing to width 1000.`)
  buffer = await s
    .resize(1000, 1000, {fit: 'inside', withoutEnlargement: true})
    .jpeg({quality: 90, mozjpeg: true})
    .toBuffer()

  return {buffer: buffer, scaled: true}
}

function scaleFileSize(buffer: Buffer, maxSizeBytes: number, log: Log): Promise<{ scaled: Buffer; numScaled: number }> {
  return shrink(buffer, 90, maxSizeBytes, 0, log)
}

async function shrink(buffer: Buffer, quality: number, maxSizeBytes: number, numScaled: number, log: Log): Promise<{
  scaled: Buffer,
  numScaled: number
}> {
  const size = buffer.byteLength
  if (size <= maxSizeBytes) return {scaled: buffer, numScaled: numScaled}

  if (quality < 5) throw new Error(`Image still too large (${size} bytes) after reducing quality to minimum`)

  log.log(`Image is too large: ${size} bytes`)

  const shrunken = await sharp(buffer).jpeg({quality: quality, mozjpeg: true}).toBuffer();

  return shrink(shrunken, quality - 5, maxSizeBytes, numScaled + 1, log)
}
