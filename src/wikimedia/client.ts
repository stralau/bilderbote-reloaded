import {MediaType, mediaTypeFrom} from "@ganbarodigital/ts-lib-mediatype/lib/v1/index.js";
import {Result} from "../util/Result.js";
import {HttpStatusError, ImageInfoResponse} from "../types/types.js";
import {HttpClient} from "../net/httpClient.js";

export interface Wikimedia {
  fetchImageInfo(filename: string): Promise<ImageInfoResponse>

  fetchMediaType(location: string): Promise<Result<MediaType>>

  fetchImage(location: string): Promise<Blob>

  fetchRandomFileLocation(): Promise<string>

}

export class WikimediaClient implements Wikimedia {
  constructor(private readonly httpClient: HttpClient) {
  }


  public fetchImageInfo = async (filename: string): Promise<ImageInfoResponse> => {
    return await this.httpClient.fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size&formatversion=2&titles=File:${filename}`)
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

    console.log("Fetching random file location...")
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

    console.log("Fetched random file location: " + res.headers.get('Location'))

    return res.headers.get('Location') || ''
  };

}
