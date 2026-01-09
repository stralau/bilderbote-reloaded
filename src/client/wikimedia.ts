import {parseStringPromise} from "xml2js";
import {MediaType, mediaTypeFrom} from "@ganbarodigital/ts-lib-mediatype/lib/v1";
import {Result} from "../util/Result";
import {HttpStatusError, XmlDesc} from "../types/types";

export interface Wikimedia {
  fetchXmlDesc(location: string): Promise<XmlDesc>

  fetchMediaType(location: string): Promise<Result<MediaType>>

  fetchImage(location: string): Promise<Blob>

  fetchRandomFileLocation(): Promise<string>
}

export class WikimediaClient implements Wikimedia {
  constructor(private readonly config: {}) {
  }

  public fetchXmlDesc = async (location: string): Promise<XmlDesc> => {
    const image = this.fileName(location)

    const xmlDesc = await fetch(`https://magnus-toolserver.toolforge.org/commonsapi.php?image=${image}`)
      .then(res => res.ok ? res : Promise.reject(res))
      .then(res => res.text())
      .then(xmlString => parseStringPromise(xmlString, {explicitArray: false}))

    return xmlDesc as XmlDesc
  }

  public fetchMediaType = async (location: string): Promise<Result<MediaType>> => {
    const response = await fetch(location, {method: 'HEAD'})

    if (!response.ok) return Result.err(
      new HttpStatusError(response.status, `Failed to fetch image from: ${location}`)
    )

    return Result.ok(mediaTypeFrom(response.headers.get('Content-Type')))
  };

  public fetchImage = async (location: string): Promise<Blob> => {
    const response = await fetch(location)

    if (!response.ok)
      throw new HttpStatusError(response.status, `Failed to fetch image from: ${location}`)

    return response.blob()
  };

  public async fetchRandomFileLocation(): Promise<string> {
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
  };


  fileName = (location: string): String => location
    .split("/")
    .pop()
    .replace(/^File:/, "");

}
