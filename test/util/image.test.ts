import sharp from "sharp";
import {DefaultImageScaler} from "../../src/util/image.js";
import {expect} from "@jest/globals";
import {Log} from "../../src/util/log.js";

async function noOpScaleDimensions(buffer: Buffer): Promise<{ buffer: Buffer, counter: number }> {
  return {buffer, counter: 0}
}

async function imageWithExifMetadata(width: number, height: number, orientation: number | undefined): Promise<Blob> {
  const buffer = await sharp({
    create: {width: width, height: height, channels: 3, background: {r: 255, g: 0, b: 0}}
  })
    .jpeg()
    .withMetadata({orientation: orientation})
    .toBuffer()

  return new Blob([new Uint8Array(buffer)], {type: 'image/jpeg'})
}

test('Corrects EXIF orientation', async () => {
  const scaler = new DefaultImageScaler(16 * 1024 * 1024, noOpScaleDimensions, new Log('Test'))
  const image = await imageWithExifMetadata(100, 50, 6)
  const scaled = await scaler.scale(image)

  const buffer = Buffer.from(await scaled.arrayBuffer())
  const md = await sharp(buffer).metadata()

  // After auto-rotation, the 100x50 image with orientation 6
  // should become 50x100 with orientation 1 (or undefined)
  expect(md.width).toBe(50)
  expect(md.height).toBe(100)
  expect(md.orientation).toBeUndefined()
})

test('Does not alter images without EXIF orientation', async () => {
  const scaler = new DefaultImageScaler(16 * 1024 * 1024, noOpScaleDimensions, new Log('Test'))

  const buffer = await sharp({
    create: {width: 100, height: 50, channels: 3, background: {r: 255, g: 0, b: 0}}
  }).jpeg().toBuffer()

  const image = new Blob([new Uint8Array(buffer)], {type: 'image/jpeg'})
  const scaled = await scaler.scale(image)

  const md = await sharp(Buffer.from(await scaled.arrayBuffer())).metadata()

  expect(md.width).toBe(100)
  expect(md.height).toBe(50)
})