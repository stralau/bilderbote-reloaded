import sharp from "sharp";
import {DefaultImageScaler} from "../../src/util/image.js";
import {expect} from "@jest/globals";
import {Log} from "../../src/util/log.js";

async function noOpScaleDimensions(buffer: Buffer): Promise<Buffer> {
  return buffer
}

async function imageWithExifRotation(width: number, height: number): Promise<Blob> {
  const buffer = await sharp({
    create: {width: width, height: height, channels: 3, background: {r: 255, g: 0, b: 0}}
  })
    .jpeg()
    // orientation 6: Rotate 90º CW
    .withMetadata({orientation: 6})
    .toBuffer()

  return new Blob([new Uint8Array(buffer)], {type: 'image/jpeg'})
}

async function imageWithExifMirror(width: number, height: number): Promise<Blob> {
  // Left half blue, right half red, stored with horizontal flip orientation (2).
  // After correction, left should appear red and right should appear blue.
  const pixels = Buffer.alloc(width * height * 3)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 3
      if (x < width / 2) {
        pixels[offset] = 0; pixels[offset + 1] = 0; pixels[offset + 2] = 255  // blue
      } else {
        pixels[offset] = 255; pixels[offset + 1] = 0; pixels[offset + 2] = 0  // red
      }
    }
  }
  const buffer = await sharp(pixels, {raw: {width, height, channels: 3}})
    .jpeg()
    .withMetadata({orientation: 2})
    .toBuffer()
  return new Blob([new Uint8Array(buffer)], {type: 'image/jpeg'})
}

test('Corrects EXIF orientation', async () => {
  const scaler = new DefaultImageScaler(16 * 1024 * 1024, noOpScaleDimensions, new Log('Test'))
  const image = await imageWithExifRotation(100, 50)
  const scaled = await scaler.scale(image)

  const buffer = Buffer.from(await scaled.arrayBuffer())
  const md = await sharp(buffer).metadata()

  // After auto-rotation, the 100x50 image with orientation 6
  // should become 50x100 with orientation 1 (or undefined)
  expect(md.width).toBe(50)
  expect(md.height).toBe(100)
  expect(md.orientation).toBeUndefined()
})

test('Corrects EXIF mirroring', async () => {
  const scaler = new DefaultImageScaler(16 * 1024 * 1024, noOpScaleDimensions, new Log('Test'))
  const image = await imageWithExifMirror(100, 50)
  const scaled = await scaler.scale(image)

  const buffer = Buffer.from(await scaled.arrayBuffer())
  const {data, info} = await sharp(buffer).raw().toBuffer({resolveWithObject: true})

  // After correction, left half should be red
  const leftOffset = (25 * info.width + 10) * info.channels
  expect(data[leftOffset]).toBeGreaterThan(data[leftOffset + 2])  // red > blue

  // After correction, right half should be blue
  const rightOffset = (25 * info.width + 90) * info.channels
  expect(data[rightOffset + 2]).toBeGreaterThan(data[rightOffset])  // blue > red
})

test('Does not alter images without EXIF orientation', async () => {
  const scaler = new DefaultImageScaler(16 * 1024 * 1024, noOpScaleDimensions, new Log('Test'))
  const image = await imageWithExifRotation(100, 50)
  const scaled = await scaler.scale(image)

  const md = await sharp(Buffer.from(await scaled.arrayBuffer())).metadata()

  expect(md.width).toBe(100)
  expect(md.height).toBe(50)
})