import sharp from "sharp";
import {Log} from "./log.js";

export interface ImageScaler {
  scale(image: Blob): Promise<Blob>
}

export class DefaultImageScaler implements ImageScaler {
  constructor(private readonly fileSize: number, private readonly scaleDimensions: (buffer: Buffer, log: Log) => Promise<Buffer>, private readonly log: Log) {
  }

  public async scale(image: Blob): Promise<Blob> {

    const rotated = await sharp(Buffer.from(await image.arrayBuffer())).rotate().toBuffer()
    const dimensionsScaled = await this.scaleDimensions(rotated, this.log)
    const scaled = await scaleFileSize(dimensionsScaled, this.fileSize, this.log);

    const md = await sharp(scaled).metadata()

    this.log.log(`Resized to ${md.width}x${md.height}, ${md.size} bytes.`)

    return new Blob([new Uint8Array(scaled)], {type: 'image/jpeg'})
  }
}

export const mastodonImageScaler = new DefaultImageScaler(16 * 1024 * 1024, mastodonScaleDimensions, new Log('Mastodon'))
export const blueskyImageScaler = new DefaultImageScaler(976_560, blueskyScaleDimensions, new Log('Bluesky'))

async function mastodonScaleDimensions(buffer: Buffer, log: Log): Promise<Buffer> {
  const s = sharp(buffer)
  const md = await s.metadata()

  if (md.width * md.height <= 8_388_608)
    return buffer

  const ratio = Math.sqrt(8_388_608 / (md.width * md.height))
  const width = Math.floor(md.width * ratio);

  log.log(`Image is too large: ${md.width}x${md.height}, ${md.size} bytes. Resizing to width ${width}.`)

  buffer = await s
    .resize({width: width, fit: 'inside', withoutEnlargement: true})
    .jpeg({quality: 90, mozjpeg: true})
    .toBuffer()

  return buffer
}

async function blueskyScaleDimensions(buffer: Buffer, log: Log): Promise<Buffer> {

  const s = sharp(buffer)
  const md = await s.metadata()

  if (md.width <= 1000 && md.height <= 1000)
    return buffer

  log.log(`Image is too large: ${md.width}x${md.height}, ${md.size} bytes. Resizing to width 1000.`)
  buffer = await s
    .resize(1000, 1000, {fit: 'inside', withoutEnlargement: true})
    .jpeg({quality: 90, mozjpeg: true})
    .toBuffer()

  return buffer
}

function scaleFileSize(buffer: Buffer, maxSizeBytes: number, log: Log): Promise<Buffer> {
  return shrink(buffer, 90, maxSizeBytes, log)
}

async function shrink(buffer: Buffer, quality: number, maxSizeBytes: number, log: Log): Promise<Buffer> {
  const size = buffer.byteLength
  if (size <= maxSizeBytes) return buffer

  if (quality < 5) throw new Error(`Image still too large (${size} bytes) after reducing quality to minimum`)

  log.log(`Image is too large: ${size} bytes`)

  const shrunken = await sharp(buffer).jpeg({quality: quality, mozjpeg: true}).toBuffer();

  return shrink(shrunken, quality - 5, maxSizeBytes, log)
}
