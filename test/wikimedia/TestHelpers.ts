import {WikimediaClient} from "../../src/wikimedia/client";
import {WikimediaService} from "../../src/wikimedia/service";
import fs from "node:fs";
import {ImageInfoResponse} from "../../src/types/types";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {HttpClient} from "../../src/net/httpClient";

export class TestClient extends WikimediaClient {
  private randomFileLocation: string

  constructor(httpClient: HttpClient) {
    super(httpClient)
  }

  public override async fetchRandomFileLocation(): Promise<string> {
    return this.randomFileLocation ? this.randomFileLocation : await super.fetchRandomFileLocation()
  }

  public setRandomFileLocation = (location: string) => {
    this.randomFileLocation = location
  }
}

export class Test {

  private readonly _wikimediaService: WikimediaService
  private readonly _wikimediaClient: TestClient

  constructor() {
    this._wikimediaClient = new TestClient(new HttpClient({userAgent: "Test User Agent (https://example.invalid) "}),)
    this._wikimediaService = new WikimediaService(this._wikimediaClient)
  }

  public withWikimediaFile: (randomFileName: string) => Test = (randomFileName: string) => {
    this._wikimediaClient.setRandomFileLocation(`https://commons.wikimedia.org/wiki/File:${randomFileName}`)
    return this
  }

  get wikimediaService(): WikimediaService {
    return this._wikimediaService;
  }

}

function getFileContents(fileName: string) {
  return fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "__testData__", `${fileName}`), "utf8");
}

export async function withImageInfo(fileName: string): Promise<(testFunction: (imageInfo: ImageInfoResponse) => void) => void> {
  const imageInfo: ImageInfoResponse = JSON.parse(getFileContents(`${fileName}.json`))

  return testFunction => testFunction(imageInfo)
}