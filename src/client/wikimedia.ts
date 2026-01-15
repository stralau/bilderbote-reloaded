import {parseStringPromise} from "xml2js";
import {MediaType, mediaTypeFrom} from "@ganbarodigital/ts-lib-mediatype/lib/v1/index.js";
import {Result} from "../util/Result.js";
import {HttpStatusError, ImageInfo, XmlDesc} from "../types/types.js";
import {HttpClient} from "../net/httpClient.js";

export interface Wikimedia {
  fetchXmlDesc(location: string): Promise<XmlDesc>

  fetchImageInfo(location: string): Promise<ImageInfo>

  fetchMediaType(location: string): Promise<Result<MediaType>>

  fetchImage(location: string): Promise<Blob>

  fetchRandomFileLocation(): Promise<string>

}

export class WikimediaClient implements Wikimedia {
  constructor(private readonly httpClient: HttpClient) {
  }


  public fetchXmlDesc = async (location: string): Promise<XmlDesc> => {
    const fileName = this.fileName(location)

    const xmlDesc = await this.httpClient.fetch(`https://magnus-toolserver.toolforge.org/commonsapi.php?image=${fileName}`)
      .then(res => res.ok ? res : Promise.reject(res))
      .then(res => res.text())
      .then(xmlString => parseStringPromise(xmlString, {explicitArray: false}))

    return xmlDesc as XmlDesc
  }

  public fetchImageInfo = async (location: string): Promise<ImageInfo> => {
    const filename = this.fileName(location)

    return await this.httpClient.fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata&formatversion=2&titles=File:${filename}`)
      .then(res => res.ok ? res : Promise.reject(res))
      .then(res => res.json())
  }

  public fetchMediaType = async (location: string): Promise<Result<MediaType>> => {
    const response = await this.httpClient.fetch(location, {method: 'HEAD'})

    if (!response.ok) return Result.err(
      new HttpStatusError(response.status, `Failed to fetch image from: ${location}`)
    )

    return Result.ok(mediaTypeFrom(response.headers.get('Content-Type')))
  };

  public fetchImage = async (location: string): Promise<Blob> => {
    const response = await this.httpClient.fetch(location)

    if (!response.ok)
      throw new HttpStatusError(response.status, `Failed to fetch image from: ${location}`)

    return response.blob()
  };

  public async fetchRandomFileLocation(): Promise<string> {
    const res = await this.httpClient.fetch('https://commons.wikimedia.org/wiki/Special:Random', {
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
