import {
  ContentType,
  contentTypeFrom,
  matchesContentType,
  MediaType
} from "@ganbarodigital/ts-lib-mediatype/lib/v1/index.js"
import {retry} from "../util/Retry.js";
import {Wikimedia} from "../client/wikimedia.js";
import {HttpStatusError, WikimediaObject, XmlDesc} from "../types/types.js";
import {asArray} from "../util/util.js";
import {Result} from "../util/Result.js";
import {htmlToText} from "html-to-text";
import {stripHtml} from "@dndxdnd/strip-html";

export class WikimediaService {
  private static knownMediaTypes: ContentType[] =
    ["image/jpeg", "image/png", "image/gif"].map(s => contentTypeFrom(s))

  private static maxSizeInBytes = 5242880

  public constructor(private readonly wikimedia: Wikimedia) {
  }

  public fetchWikimediaObject = async (): Promise<WikimediaObject> => {
    return await retry({
      attempts: 10,
      isFatal: e => e instanceof HttpStatusError && e.status == 429,
      fn: async () => {
        const location = await this.wikimedia.fetchRandomFileLocation();
        const r = await this.fetchImageDescription(location);
        return r.map(async xmlDesc => {
          console.log("location", location)
          const description = this.getDescription(xmlDesc);

          const fileSection = xmlDesc.response.file;
          const licenses = asArray(xmlDesc.response.licenses.license);

          const imageInfoPromise = this.wikimedia.fetchImageInfo(location);
          const imagePromise = this.wikimedia.fetchImage(fileSection.urls.file);

          const imageInfo = await imageInfoPromise;
          const author = await stripHtml(imageInfo.query.pages[0]?.imageinfo[0]?.extmetadata.Artist.value);
          const image = await imagePromise;

          return {
            attribution: {
              author: author && author != "" ? author : (fileSection.author ? fileSection.author : fileSection.uploader),
              date: this.getDate(xmlDesc),
              licence: licenses.length > 0 ? licenses[0].name : "",
              url: encodeURI(fileSection.urls.description.replace(/^http:/, "https:")),
            },
            description: description,
            image: image
          }
        });
      },
    }).then(r => r.get())

  }

  fetchImageDescription = async (location: string): Promise<Result<XmlDesc>> => {

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
    let descriptions = asArray(xmlDesc.response.description.language);

    const description = descriptions && descriptions.every(d => d && d.$ && d._) ?
      (descriptions.find(l => l.$.code == "default") || descriptions[0])._
      : xmlDesc.response.file.name;


    return this.sanitiseDescription(description);

  }

  getDate(xmlDesc: XmlDesc): string {
    const fileSection = xmlDesc.response.file;
    const date = new Date(fileSection.date ? fileSection.date : fileSection.upload_date,)
    return date.toLocaleDateString('en-GB', {dateStyle: 'long'})
  }

  sanitiseDescription = (description: string): string =>
    htmlToText(description).replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim()

}

