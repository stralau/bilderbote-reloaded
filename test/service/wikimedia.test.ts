import {expect} from "@jest/globals";
import {Test, withXmlDesc} from "./TestHelpers";
import {Elem} from "../../src/types/types";

test('Posts image', async () => {

  const service = new Test()
    .withWikimediaFile("ISS039-E-14528_-_View_of_Earth.jpg")
    .wikimediaService

  const image = await service.fetchImage()

  expect(image).toBeDefined()
  expect(image.description).toBe("View of Earth taken during ISS Expedition 39.")
})

test('Take file title if no description', async () => {

  const service = new Test()
    .wikimediaService

  return withXmlDesc("no-description") (xmlDesc => {
    expect(service.getDescription(xmlDesc)).toEqual(xmlDesc.response.file.name)
  })
})

test('Take first description if no default', async () => {

  const service = new Test()
    .wikimediaService

  return withXmlDesc("one-description-no-default") (xmlDesc => {
    expect(service.getDescription(xmlDesc)).toEqual((xmlDesc.response.description.language as Elem)._.trim())
  })
})

