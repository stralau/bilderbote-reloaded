import sharp, {Sharp} from "sharp";
import {Log} from "./log.js";

export interface ImageScaler {
  scale(image: Blob): Promise<Blob>
}

class DefaultImageScaler implements ImageScaler {
  constructor(private readonly fileSize: number, private readonly scaleDimensions: (sharp: Sharp, log: Log) => Promise<{
    sharp: Sharp,
    scaled: boolean
  }>, private readonly log: Log) {
  }

  public async scale(image: Blob): Promise<Blob> {
    let type = image.type
    const scaleResult: {
      sharp: Sharp;
      scaled: boolean
    } = await this.scaleDimensions(sharp(Buffer.from(await image.arrayBuffer())), this.log)
    let counter = scaleResult.scaled ? 1 : 0

    const {scaled, numScaled} = await scaleFileSize(scaleResult.sharp, this.fileSize, this.log)
    counter += numScaled
    const buffer: Buffer = await scaled.toBuffer();

    if (counter > 0) {
      type = 'image/jpeg'

      // Metadata is only recalculated after calling toBuffer(), so we have to fetch it again here
      const md = await sharp(buffer).metadata()

      this.log.log(`Scaled ${counter} time(s). Resized to ${md.width}x${md.height}, ${md.size} bytes.`)
    }

    return new Blob([new Uint8Array(buffer)], {type: type})

  }
}

export const mastodonImageScaler = new DefaultImageScaler(16 * 1024 * 1024, mastodonScaleDimensions, new Log('Mastodon'))
export const blueskyImageScaler = new DefaultImageScaler(976_560, blueskyScaleDimensions, new Log('Bluesky'))

async function mastodonScaleDimensions(sharp: Sharp, log: Log): Promise<{ sharp: Sharp, scaled: boolean }> {
  const md = await sharp.metadata()

  if (md.width * md.height <= 8_388_608)
    return {sharp: sharp, scaled: false}

  const ratio = Math.sqrt(8_388_608 / (md.width * md.height))
  const width = Math.floor(md.width * ratio);

  log.log(`Image is too large: ${md.width}x${md.height}, ${md.size} bytes. Resizing to width ${width}.`)

  sharp = sharp
    .resize({width: width, fit: 'inside', withoutEnlargement: true})
    .jpeg({quality: 90, mozjpeg: true})

  return {sharp: sharp, scaled: true}
}

async function blueskyScaleDimensions(sharp: Sharp, log: Log): Promise<{ sharp: Sharp, scaled: boolean }> {
  const md = await sharp.metadata()

  if (md.width <= 1000 && md.height <= 1000)
    return {sharp: sharp, scaled: false}

  log.log(`Image is too large: ${md.width}x${md.height}, ${md.size} bytes. Resizing to width 1000.`)
  sharp = sharp
    .resize(1000, 1000, {fit: 'inside', withoutEnlargement: true})
    .jpeg({quality: 90, mozjpeg: true})

  return {sharp: sharp, scaled: true}
}

function scaleFileSize(sharp: Sharp, maxSizeBytes: number, log: Log): Promise<{ scaled: Sharp, numScaled: number }> {
  return shrink(sharp, 90, maxSizeBytes, 0, log)
}

async function shrink(sharp: Sharp, quality: number, maxSizeBytes: number, numScaled: number, log: Log): Promise<{
  scaled: Sharp,
  numScaled: number
}> {
  const size = (await sharp.toBuffer()).byteLength
  if (size <= maxSizeBytes) return {scaled: sharp, numScaled: numScaled}

  if (quality < 5) throw new Error(`Image still too large (${size} bytes) after reducing quality to minimum`)

  log.log(`Image is too large: ${size} bytes`)

  return shrink(sharp.jpeg({quality: quality, mozjpeg: true}), quality - 5, maxSizeBytes, numScaled + 1, log)
}
