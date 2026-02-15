import {Metadata, WikimediaObject} from "../types/types.js";

export interface PostImageClient {
  post(image: Blob, metadata: Metadata): Promise<void>
}

export interface RepostClient {
  repost(): Promise<string>
}