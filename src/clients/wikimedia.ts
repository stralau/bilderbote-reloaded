import {
  ContentType,
  contentTypeFrom,
  matchesContentType,
  MediaType,
  mediaTypeFrom
} from "@ganbarodigital/ts-lib-mediatype/lib/v1"
import {parseStringPromise} from "xml2js";
import {Result} from "../types/Result";
import {retry} from "../types/Retry";

export async function fetchWikimediaImage(): Promise<XmlDesc> {
  return await retry({
    fn: fetchImage,
    attempts: 10,
    isFatal: e => e instanceof HttpStatusError && e.status == 429
  }).then(r => r.get())
}

async function fetchImage(): Promise<Result<XmlDesc>> {

  const location = await fetchRandomFileLocation()
  const xmlDesc = await fetchXmlDesc(location)

  const imageLocation = xmlDesc.response.file.urls.file
  const response = await fetch(imageLocation, {
    method: 'HEAD'
  })

  if (!response.ok) {
    return Result.err(
      new HttpStatusError(response.status,
        `Failed to fetch image from: ${imageLocation}`
      )
    )
  }

  const mediaType = mediaTypeFrom(response.headers.get('Content-Type'));
  return validate(xmlDesc, mediaType)
    .onError(err => console.log("Validating image from: %s. Error: %s", location, err.message));
}

async function fetchRandomFileLocation(): Promise<string> {
  const res = await fetch('https://commons.wikimedia.org/wiki/Special:Random', {
    method: 'GET',
    redirect: 'manual'
  })

  if (res.status != 302) {
    console.log(res.status)
    throw new Error(
      `Failed to fetch random file location: ${res.status} ${res.statusText}`
    )
  }

  return res.headers.get('Location') || ''
}

async function fetchXmlDesc(location: string): Promise<XmlDesc> {
  const image = fileName(location)

  const xmlDesc = await fetch(`https://magnus-toolserver.toolforge.org/commonsapi.php?image=${image}`)
    .then(res => res.ok ? res : Promise.reject(res))
    .then(res => res.text())
    .then(xmlString => parseStringPromise(xmlString, {explicitArray: false}))

  return xmlDesc as XmlDesc
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

function fileName(location: string): String {
  return location
    .split("/")
    .pop()
    .replace(/^File:/, "")
}

interface XmlDesc {
  response: {
    file: {
      name: string
      title: string
      size: number
      urls: {
        file: string
        description: string
        date: string
      }
    }
    licenses: {
      license: {
        name: string
      }
    }
  }
}

const knownMediaTypes: ContentType[] =
  ["image/jpeg", "image/png", "image/gif"].map(s => contentTypeFrom(s))

const maxSizeInBytes = 5242880

class HttpStatusError extends Error {
  constructor(public readonly status: number, message?: string) {
    super((message + ' ' || '') + `HTTP status ${status}`)
  }
}