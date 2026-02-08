import {ContentType, contentTypeFrom, matchesContentType} from "@ganbarodigital/ts-lib-mediatype/lib/v1/index.js"
import {retry} from "../util/Retry.js";
import {Wikimedia} from "./client.js";
import {ExtMetadata, HttpStatusError, ImageInfo, ImageInfoResponse, WikimediaObject} from "../types/types.js";
import {Result} from "../util/Result.js";
import {attribution} from "./attribution.js";
import {sanitiseText} from "../util/text.js";

export class WikimediaService {
  private static knownMediaTypes: ContentType[] =
    ["image/jpeg", "image/png", "image/gif"].map(s => contentTypeFrom(s))

  private static maxSizeInBytes = 5242880

  public constructor(private readonly wikimedia: Wikimedia) {
  }

  public fetchWikimediaObject = async (): Promise<WikimediaObject> => {

    const imageInfoResult = await retry({
      attempts: 10,
      fn: this.fetchInfo,
      isFatal: e => e instanceof HttpStatusError && e.status == 429,
    });

    const imageInfo = imageInfoResult.get()

    const imagePromise = this.wikimedia.fetchImage(imageInfo.url);
    return {
      description: await this.getDescription(imageInfo.extmetadata),
      image: await imagePromise,
      attribution: await attribution(imageInfo)
    } as WikimediaObject

  }

  fetchInfo = async () => {
    const location = await this.wikimedia.fetchRandomFileLocation();
    console.log("location", location)

    const imageInfoResponse = await this.wikimedia.fetchImageInfo(location);
    console.log("imageInfoResponse", JSON.stringify(imageInfoResponse, null, 2))
    return this.validate(imageInfoResponse)
  }

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

  getDescription = async (extMetadata: ExtMetadata): Promise<string> => {

    const description = extMetadata.ImageDescription?.value ?? extMetadata.ObjectName?.value;
    return sanitiseText(description);

  }
}
