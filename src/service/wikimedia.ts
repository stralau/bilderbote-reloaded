import {ContentType, contentTypeFrom, matchesContentType, MediaType} from "@ganbarodigital/ts-lib-mediatype/lib/v1"
import {Result} from "../util/Result";
import {retry} from "../util/Retry";
import {Wikimedia} from "../client/wikimedia";
import {HttpStatusError, WikimediaObject, XmlDesc} from "../types/types";
import {htmlToText} from "html-to-text";

export class WikimediaService {
  private static knownMediaTypes: ContentType[] =
    ["image/jpeg", "image/png", "image/gif"].map(s => contentTypeFrom(s))

  private static maxSizeInBytes = 5242880

  public constructor(private readonly wikimedia: Wikimedia) {
  }

  public fetchImage = async (): Promise<WikimediaObject> => {
    const xmlDesc = await retry({
      fn: this.fetchImageDescription,
      attempts: 10,
      isFatal: e => e instanceof HttpStatusError && e.status == 429
    }).then(r => r.get())

    const description = await this.getDescription(xmlDesc);

    return {
      description: description,
      image: await this.wikimedia.fetchImage(xmlDesc.response.file.urls.file),
    }
  }

  fetchImageDescription = async (): Promise<Result<XmlDesc>> => {

    const location = await this.wikimedia.fetchRandomFileLocation()
    const xmlDesc = await this.wikimedia.fetchXmlDesc(location)

    const imageLocation = xmlDesc.response.file.urls.file

    const mediaType = await this.wikimedia.fetchMediaType(imageLocation)

    return mediaType.flatMap(mediaType => this.validate(xmlDesc, mediaType))
      .onError(err => console.log(err.message))
  }

  validate = (xmlDesc: XmlDesc, mediaType: MediaType): Result<XmlDesc> => {

    if (!matchesContentType(mediaType, WikimediaService.knownMediaTypes)) {
      return Result.err(Error("Image is not a known media type: " + mediaType))
    }

    if (xmlDesc.response.file.size > WikimediaService.maxSizeInBytes) {
      return Result.err(Error("Image is too large: " + xmlDesc.response.file.size + " bytes"))
    }

    return Result.ok(xmlDesc)
  }

  getDescription = (xmlDesc: XmlDesc): string => {
    let descriptions = xmlDesc.response.description.language;

    if (!Array.isArray(descriptions)) {
      descriptions = [descriptions];
    }

    const description = descriptions && descriptions.every(d => d && d.$ && d._) ?
      (descriptions.find(l => l.$.code == "default") || descriptions[0])._
      : xmlDesc.response.file.name;


    return this.sanitiseDescription(description);

  }

  sanitiseDescription = (description: string): string =>
    htmlToText(description).replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim()

}

