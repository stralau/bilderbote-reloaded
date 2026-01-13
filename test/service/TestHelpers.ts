import {WikimediaClient} from "../../src/client/wikimedia";
import {WikimediaService} from "../../src/service/wikimedia";
import ProvidesCallback = jest.ProvidesCallback;
import fs from "node:fs";
import {parseStringPromise} from "xml2js";
import {XmlDesc} from "../../src/types/types";
import {expect} from "@jest/globals";
import path from "node:path";

export class TestClient extends WikimediaClient {
  private randomFileLocation: string

  public override async fetchRandomFileLocation(): Promise<string> {
    console.log(this.randomFileLocation ? "Using random file location" : "Not using random file location")
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
    this._wikimediaClient = new TestClient({})
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

export function withXmlDesc(fileName: string): (testFunction: (xmlDesc: XmlDesc) => void) => Promise<void> {
  const fileContents = fs.readFileSync(path.join(__dirname, "__testData__", `${fileName}.xml`), "utf8")

  return testFunction => parseStringPromise(fileContents, {explicitArray: false}).then(testFunction)
}