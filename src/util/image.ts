import sharp, {Metadata} from "sharp";

export async function downScale(original: Blob, maxSizeBytes: number, scaleDimensions: (image: Buffer, md: Metadata) => Promise<{image: Buffer, scaled: boolean}>): Promise<Blob> {

  let type = original.type
  let counter = 0

  const buffer = Buffer.from(await original.arrayBuffer());
  let {image, scaled} = await scaleDimensions(buffer, await sharp(buffer).metadata())
  if (scaled) counter++

  async function shrink(image: Buffer, quality: number, counter: number): Promise<{ image: Buffer, counter: number }> {
    if (image.byteLength <= maxSizeBytes) return {image: image, counter: counter}

    if (quality < 5) throw new Error(`Image still too large (${image.byteLength} bytes) after reducing quality to minimum`)

    console.log(`Image is too large: ${image.byteLength} bytes`)

    return shrink(await sharp(image).jpeg({quality: quality, mozjpeg: true}).toBuffer(), quality - 5, counter + 1)
  }

  const result = await shrink(image, 90, counter)

  if (result.counter > 0) {
    type = 'image/jpeg'
    console.log(`Downscaled image ${result.counter} times`)
  }

  return new Blob([new Uint8Array(result.image)], {type: type})
}
