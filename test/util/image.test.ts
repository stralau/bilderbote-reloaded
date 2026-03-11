import sharp from "sharp";
import {DefaultImageScaler} from "../../src/util/image.js";
import {expect} from "@jest/globals";
import {Log} from "../../src/util/log.js";

async function noOpScaleDimensions(buffer: Buffer): Promise<Buffer> {
  return buffer
}

async function imageWithExifRotation(width: number, height: number, orientation: number): Promise<Blob> {
  const buffer = await sharp({
    create: {width: width, height: height, channels: 3, background: {r: 255, g: 0, b: 0}}
  })
    .jpeg()
    // orientation 6: Rotate 90º CW
    .withMetadata({orientation: orientation})
    .toBuffer()

  return new Blob([new Uint8Array(buffer)], {type: 'image/jpeg'})
}

async function imageWithExifMirror(width: number, height: number): Promise<Blob> {
  // Left half blue, right half red, stored with horizontal flip orientation (2).
  // After correction, left should appear red and right should appear blue.
  const pixels: Buffer<ArrayBuffer> = Buffer.alloc(width * height * 3)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 3
      if (x < width / 2 && y < height / 2) {
        // top left: blue
        pixels[offset] = 0; pixels[offset + 1] = 0; pixels[offset + 2] = 255
      } else if (x >= width / 2 && y < height / 2) {
        // top right: red
        pixels[offset] = 255; pixels[offset + 1] = 0; pixels[offset + 2] = 0
      } else if (x < width / 2 && y >= height / 2) {
        // bottom left: green
        pixels[offset] = 0; pixels[offset + 1] = 255; pixels[offset + 2] = 0
      } else if (x >= width / 2 && y >= height / 2) {
        // bottom right: yellow
        pixels[offset] = 255; pixels[offset + 1] = 255; pixels[offset + 2] = 0
      }
    }
  }

  const buffer = await sharp(pixels, {raw: {width, height, channels: 3}})
    .jpeg()
    .withMetadata({orientation: 2})
    .toBuffer()

  // Enable the next line to print the image to a terminal if running in iTerm2
  // process.stdout.write(`\x1b]1337;File=inline=1:${buffer.toString('base64')}\x07\n`)

  return new Blob([new Uint8Array(buffer)], {type: 'image/jpeg'})
}

test('Corrects EXIF orientation', async () => {
  const scaler = new DefaultImageScaler(16 * 1024 * 1024, noOpScaleDimensions, new Log('Test'))
  const image = await imageWithExifRotation(100, 50, 6)
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

  // Enable the next line to print the image to a terminal if running in iTerm2
  // process.stdout.write(`\x1b]1337;File=inline=1:${buffer.toString('base64')}\x07\n`)

  // The top left should be red
  const topLeftOffset = (10 * info.width + 10) * info.channels
  // using toBeGreaterThan here, as somehow during mirroring, 255 gets changed to 254
  expect(data[topLeftOffset]).toBeGreaterThan(250)
  expect(data[topLeftOffset + 1]).toBe(0)
  expect(data[topLeftOffset + 2]).toBe(0)

  // The top right should be blue
  const topRightOffset = (10 * info.width + 90) * info.channels
  expect(data[topRightOffset]).toBe(0)
  expect(data[topRightOffset + 1]).toBe(0)
  expect(data[topRightOffset + 2]).toBeGreaterThan(250)

  // The bottom left should be yellow
  const bottomLeftOffset = (40 * info.width + 10) * info.channels
  expect(data[bottomLeftOffset]).toBeGreaterThan(250)
  expect(data[bottomLeftOffset + 1]).toBeGreaterThan(250)
  expect(data[bottomLeftOffset + 2]).toBe(0)

  // The bottom right should be green
  const bottomRightOffset = (40 * info.width + 90) * info.channels
  expect(data[bottomRightOffset]).toBe(0)
  expect(data[bottomRightOffset + 1]).toBeGreaterThan(250)
  expect(data[bottomRightOffset + 2]).toBeLessThan(10)
})

test('Does not alter images without EXIF orientation', async () => {
  const scaler = new DefaultImageScaler(16 * 1024 * 1024, noOpScaleDimensions, new Log('Test'))
  const image = await imageWithExifRotation(100, 50, undefined)
  const scaled = await scaler.scale(image)

  const md = await sharp(Buffer.from(await scaled.arrayBuffer())).metadata()

  expect(md.width).toBe(100)
  expect(md.height).toBe(50)
})