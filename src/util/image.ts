import sharp, {Metadata, Sharp} from "sharp";
import {Log} from "./log.js";

export interface ImageScaler {
  scale(image: Blob): Promise<Blob>
}

type ScaleResult = {
  buffer: Buffer,
  counter: number,
}

class DefaultImageScaler implements ImageScaler {
  constructor(private readonly fileSize: number, private readonly scaleDimensions: (buffer: Buffer, log: Log) => Promise<ScaleResult>, private readonly log: Log) {
  }

  public async scale(image: Blob): Promise<Blob> {

    const dimensionScaleResult = await this.scaleDimensions(Buffer.from(await image.arrayBuffer()), this.log)
    const sizeScaleResult = await scaleFileSize(dimensionScaleResult.buffer, this.fileSize, this.log)
    const counter = dimensionScaleResult.counter + sizeScaleResult.counter

    if (counter == 0) {
      return image
    }

    const scaled = sizeScaleResult.buffer;
    const md = await sharp(scaled).metadata()

    this.log.log(`Scaled ${counter} time(s). Resized to ${md.width}x${md.height}, ${md.size} bytes.`)

    return new Blob([new Uint8Array(scaled)], {type: 'image/jpeg'})
  }
}

export const mastodonImageScaler = new DefaultImageScaler(16 * 1024 * 1024, mastodonScaleDimensions, new Log('Mastodon'))
export const blueskyImageScaler = new DefaultImageScaler(976_560, blueskyScaleDimensions, new Log('Bluesky'))

async function mastodonScaleDimensions(buffer: Buffer, log: Log): Promise<ScaleResult> {
  const s = sharp(buffer)
  const md = await s.metadata()

  if (md.width * md.height <= 8_388_608)
    return {buffer: buffer, counter: 0}

  const ratio = Math.sqrt(8_388_608 / (md.width * md.height))
  const width = Math.floor(md.width * ratio);

  log.log(`Image is too large: ${md.width}x${md.height}, ${md.size} bytes. Resizing to width ${width}.`)

  buffer = await s
    .resize({width: width, fit: 'inside', withoutEnlargement: true})
    .jpeg({quality: 90, mozjpeg: true})
    .toBuffer()

  return {buffer: buffer, counter: 1}
}

async function blueskyScaleDimensions(buffer: Buffer, log: Log): Promise<ScaleResult> {

  const s = sharp(buffer)
  const md = await s.metadata()

  if (md.width <= 1000 && md.height <= 1000)
    return {buffer: buffer, counter: 0}

  log.log(`Image is too large: ${md.width}x${md.height}, ${md.size} bytes. Resizing to width 1000.`)
  buffer = await s
    .resize(1000, 1000, {fit: 'inside', withoutEnlargement: true})
    .jpeg({quality: 90, mozjpeg: true})
    .toBuffer()

  return {buffer: buffer, counter: 1}
}

function scaleFileSize(buffer: Buffer, maxSizeBytes: number, log: Log): Promise<ScaleResult> {
  return shrink(buffer, 90, maxSizeBytes, 0, log)
}

async function shrink(buffer: Buffer, quality: number, maxSizeBytes: number, counter: number, log: Log): Promise<ScaleResult> {
  const size = buffer.byteLength
  if (size <= maxSizeBytes) return {buffer: buffer, counter: counter}

  if (quality < 5) throw new Error(`Image still too large (${size} bytes) after reducing quality to minimum`)

  log.log(`Image is too large: ${size} bytes`)

  const shrunken = await sharp(buffer).jpeg({quality: quality, mozjpeg: true}).toBuffer();

  return shrink(shrunken, quality - 5, maxSizeBytes, counter + 1, log)
}
