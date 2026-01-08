import {ContentType, contentTypeFrom, matchesContentType, MediaType} from "@ganbarodigital/ts-lib-mediatype/lib/v1"
import {Result} from "../util/Result";
import {retry} from "../util/Retry";
import {fetchImage, fetchMediaType, fetchRandomFileLocation, fetchXmlDesc} from "../client/wikimedia";
import {HttpStatusError, WikimediaObject, XmlDesc} from "../types/types";


export async function fetchWikimediaImage(): Promise<WikimediaObject> {
  const xmlDesc = await retry({
    fn: fetchImageDescription,
    attempts: 10,
    isFatal: e => e instanceof HttpStatusError && e.status == 429
  }).then(r => r.get())

  console.log(JSON.stringify(xmlDesc, null, 2))

  const description = getDescription(xmlDesc);

  return {
    description: description,
    image: await fetchImage(xmlDesc.response.file.urls.file),
  }
}

async function fetchImageDescription(): Promise<Result<XmlDesc>> {

  const location = await fetchRandomFileLocation()
  const xmlDesc = await fetchXmlDesc(location)

  const imageLocation = xmlDesc.response.file.urls.file

  const mediaType = await fetchMediaType(imageLocation)

  return mediaType.flatMap(mediaType => validate(xmlDesc, mediaType))
    .onError(err => console.log(err.message))
}

function validate(xmlDesc: XmlDesc, mediaType: MediaType): Result<XmlDesc> {

  if (!matchesContentType(mediaType, knownMediaTypes)) {
    return Result.err(Error("Image is not a known media type: " + mediaType))
  }

  if (xmlDesc.response.file.size > maxSizeInBytes) {
    return Result.err(Error("Image is too large: " + xmlDesc.response.file.size + " bytes"))
  }

  return Result.ok(xmlDesc)
}

function getDescription(xmlDesc: XmlDesc) {
  let descriptions = xmlDesc.response.description.language;

  if (!Array.isArray(descriptions)) {
    descriptions = [descriptions];
  }

  return (
    descriptions && descriptions.every(d => d && d.$ && d._) ?
      (descriptions.find(l => l.$.code == "default") || descriptions[0])._
      : xmlDesc.response.file.name
  ).trim().slice(0, 300);
}

const knownMediaTypes: ContentType[] =
  ["image/jpeg", "image/png", "image/gif"].map(s => contentTypeFrom(s))

const maxSizeInBytes = 5242880

