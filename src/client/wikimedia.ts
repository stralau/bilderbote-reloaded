import {parseStringPromise} from "xml2js";
import {MediaType, mediaTypeFrom} from "@ganbarodigital/ts-lib-mediatype/lib/v1";
import {Result} from "../util/Result";
import {HttpStatusError, XmlDesc} from "../types/types";

export async function fetchXmlDesc(location: string): Promise<XmlDesc> {
  const image = fileName(location)

  const xmlDesc = await fetch(`https://magnus-toolserver.toolforge.org/commonsapi.php?image=${image}`)
    .then(res => res.ok ? res : Promise.reject(res))
    .then(res => res.text())
    .then(xmlString => parseStringPromise(xmlString, {explicitArray: false}))

  return xmlDesc as XmlDesc
}

export async function fetchMediaType(location: string): Promise<Result<MediaType>> {
  const response = await fetch(location, {method: 'HEAD'})

  if (!response.ok) return Result.err(
    new HttpStatusError(response.status, `Failed to fetch image from: ${location}`)
  )

  return Result.ok(mediaTypeFrom(response.headers.get('Content-Type')))
}

export async function fetchImage(location: string): Promise<Blob> {
  const response = await fetch(location)

  if (!response.ok)
    throw new HttpStatusError(response.status, `Failed to fetch image from: ${location}`)

  return response.blob()
}

export async function fetchRandomFileLocation(): Promise<string> {
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


function fileName(location: string): String {
  return location
    .split("/")
    .pop()
    .replace(/^File:/, "")
}
