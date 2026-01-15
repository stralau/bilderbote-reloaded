import {parseStringPromise} from "xml2js";
import {MediaType, mediaTypeFrom} from "@ganbarodigital/ts-lib-mediatype/lib/v1/index.js";
import {Result} from "../util/Result.js";
import {HttpStatusError, ImageInfo, XmlDesc} from "../types/types.js";

export interface Wikimedia {
  fetchXmlDesc(location: string): Promise<XmlDesc>

  fetchImageInfo(location: string): Promise<ImageInfo>

  fetchMediaType(location: string): Promise<Result<MediaType>>

  fetchImage(location: string): Promise<Blob>

  fetchRandomFileLocation(): Promise<string>

}

export class WikimediaClient implements Wikimedia {
  constructor(private readonly config: {}) {
  }

  public fetchXmlDesc = async (location: string): Promise<XmlDesc> => {
    const fileName = this.fileName(location)

    const xmlDesc = await get(`https://magnus-toolserver.toolforge.org/commonsapi.php?image=${fileName}`)
      .then(res => res.ok ? res : Promise.reject(res))
      .then(res => res.text())
      .then(xmlString => parseStringPromise(xmlString, {explicitArray: false}))

    return xmlDesc as XmlDesc
  }

  public fetchImageInfo = async (location: string): Promise<ImageInfo> => {
    const filename = this.fileName(location)

    return await get(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata&formatversion=2&titles=File:${filename}`)
      .then(res => res.ok ? res : Promise.reject(res))
      .then(res => res.json())
  }

  public fetchMediaType = async (location: string): Promise<Result<MediaType>> => {
    const response = await get(location, {method: 'HEAD'})

    if (!response.ok) return Result.err(
      new HttpStatusError(response.status, `Failed to fetch image from: ${location}`)
    )

    return Result.ok(mediaTypeFrom(response.headers.get('Content-Type')))
  };

  public fetchImage = async (location: string): Promise<Blob> => {
    const response = await get(location)

    if (!response.ok)
      throw new HttpStatusError(response.status, `Failed to fetch image from: ${location}`)

    return response.blob()
  };

  public async fetchRandomFileLocation(): Promise<string> {
    const res = await get('https://commons.wikimedia.org/wiki/Special:Random', {
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

function get(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {

  if (!init) init = {};
  if (!init.headers) init.headers = {} as Record<string, string>;

  init.headers["User-Agent"] = "Bilderbote/2.0 (https://github.com/stralau/bilderbote-reloaded)";
  return fetch(input, init);
}
