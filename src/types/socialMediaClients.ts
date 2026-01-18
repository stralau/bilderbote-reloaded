import {WikimediaObject} from "../types/types.js";

export interface PostImageClient {
  post(image: WikimediaObject): Promise<void>
}

export interface RepostClient {
  repost(): Promise<string>
}