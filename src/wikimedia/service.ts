import {ContentType, contentTypeFrom, matchesContentType} from "@ganbarodigital/ts-lib-mediatype/lib/v1/index.js"
import {retry} from "../util/Retry.js";
import {Wikimedia} from "./client.js";
import {
  HttpStatusError,
  ImageInfo,
  ImageInfoResponse,
  map,
  Option,
  optional,
  toArray,
  WikimediaObject
} from "../types/types.js";
import {Result} from "../util/Result.js";
import {attribution} from "./attribution.js";
import {sanitiseText} from "../util/text.js";

export class WikimediaService {
  private static knownMediaTypes: ContentType[] =
    ["image/jpeg", "image/png", "image/gif"].map(s => contentTypeFrom(s))

  private static maxSizeInBytes = 5242880

  public constructor(private readonly wikimedia: Wikimedia) {
  }

  public fetchWikimediaObject = async (location?: string | undefined): Promise<WikimediaObject> => {

    const imageInfoResult = await this.fetchInfo(location)

    const imageInfo = imageInfoResult.get()

    const imagePromise = this.wikimedia.fetchImage(imageInfo.url);
    return {
      metadata: {
        description: await this.getDescription(imageInfo),
        attribution: await attribution(imageInfo)
      },
      image: await imagePromise,
    } as WikimediaObject

  }

  fetchInfo = async (location?: string | undefined): Promise<Result<ImageInfo>> => {
    const filename = this.fileName(location ?? (await this.wikimedia.fetchRandomFileLocation()));

    const imageInfoResponse = await this.wikimedia.fetchImageInfo(filename);
    console.log("imageInfoResponse", JSON.stringify(imageInfoResponse, null, 2))
    return (await this.validate(imageInfoResponse)).map(imageInfo => ({...imageInfo, filename}))
  }

  private fileName = (location: string): string => location
    .split("/")
    .pop()
    .replace(/^File:/, "");

  validate = async (response: ImageInfoResponse): Promise<Result<ImageInfo>> => {

    const pages = response.query.pages;
    if (pages.length != 1) {
      return Result.err(Error("Non-unique image info – zero or multiple pages"))
    }

    const infos = pages[0].imageinfo
    if (infos.length != 1) {
      return Result.err(Error("Non-unique image info – zero or multiple info objects"))
    }

    const imageInfo = infos[0]

    const size = imageInfo.size;
    if (size > WikimediaService.maxSizeInBytes) {
      return Result.err(Error("Image is too large: " + size + " bytes"))
    }

    const mediaTypeResult = await this.wikimedia.fetchMediaType(imageInfo.url)

    return mediaTypeResult.filter(mt => {
        return matchesContentType(mt, WikimediaService.knownMediaTypes) || Error("Image is not a known media type: " + mt)
      }
    ).map(mt => imageInfo)
  }

  getDescription = async (imageInfo: ImageInfo): Promise<string> => {

    const title: Option<string> = map(optional(imageInfo.extmetadata.ObjectName?.value), sanitiseText);
    const description: Option<string> = map(optional(imageInfo.extmetadata.ImageDescription?.value), sanitiseText);

    return (title || description) ? [title, description].map(toArray).flat().join(" – ") : imageInfo.filename
  }
}
