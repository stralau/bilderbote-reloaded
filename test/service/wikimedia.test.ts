import {expect} from "@jest/globals";
import {Test, withXmlDesc} from "./TestHelpers";
import {Elem} from "../../src/types/types";

test('Fetches image', async () => {

  const service = new Test()
    .withWikimediaFile("ISS039-E-14528_-_View_of_Earth.jpg")
    .wikimediaService

  const image = await service.fetchImage()

  expect(image).toBeDefined()
  expect(image.description).toBe("View of Earth taken during ISS Expedition 39.")
  expect(image.attribution.author).toBe("Askeuhd")
  expect(image.attribution.date).toBe("2021-05-24T23:52:32Z")
  expect(image.attribution.licence).toBe("PD NASA")
  expect(image.attribution.url).toBe("http://commons.wikimedia.org/wiki/File:ISS039-E-14528_-_View_of_Earth.jpg")
})

test('Take file title if no description', async () => {

  const service = new Test()
    .wikimediaService

  return withXmlDesc("no-description") (xmlDesc => {
    const description = service.getDescription(xmlDesc)

    expect(description).toEqual(xmlDesc.response.file.name)
  })
})

test('Take first description if no default', async () => {

  const service = new Test()
    .wikimediaService

  return withXmlDesc("one-description-no-default") (xmlDesc => {
    expect(service.getDescription(xmlDesc)).toEqual(service.sanitiseDescription((xmlDesc.response.description.language as Elem)._))
  })
})

test('Sanitises description' , async () => {
  const service = new Test()
    .wikimediaService

  return withXmlDesc("html-description-with-newlines") (xmlDesc => {
    expect(service.getDescription(xmlDesc)).toEqual("Objectgegevens Titel: Tinnen figuur in de vorm van Franse trompettist (kurassier) te paard Beschrijving: Tinnen beeldje met een groen geschilderd voetstuk. Het beeldje stelt een Franse kurassier, meer in het bijzonder een trompettist te paard rond 1812-1815 voor. Het paard gaat stapvoets. De berijder heeft de teugels in zijn linkerhand en de goudkleurige trompet in de rechterhand. Het mondstuk staat aan de mond. Het beeldje is als volgt geverfd: blauwe wapenrok met rode epauletten, zilverkleurige kuras, witte broek, zwarte laarzen, goudkleurige helm met zwarte paardenstaart. Gewapend met sabel. Het paard is wit met een lange staart en heeft een zwart tuig en een blauw dekkleed met witte biezen. Trefwoorden: karakterspeelgoed, speelgoed, ontspanningsmiddel Vervaardiger: Allgeyer Plaats vervaardiging: Duitsland, Fürth Datering: 1860 - 1880 Technieken: gegoten, beschilderd Materiaal: metaal, tin, lood, verf Afmetingen: (cm) hg 4,1 / br 3,2 / dp 0,9 Associatie: tinnen soldaatje, afgietsel, figuur, figuurvoorstelling, , cavalerie, kurassier, leger, oorlog, Napoleon I, 1812-1815, militaria, spelen, communicatie, bevel, muziek Vorm & decoratie: soldaat, kurassier, trompettist, wapenrok, epaulet, kuras, helm, paardenstaart, pluim, sabel, paard, dier, trompet, musicus Inventarisnr: Museum Rotterdam 90005")
  })
})

test('Renders data correctly', async () => {
  const service = new Test()
    .wikimediaService

  return withXmlDesc("html-description-with-newlines") (xmlDesc => {
    expect(service.getDate(xmlDesc)).toEqual("12 March 2020")
  })
})

test('Removes html' , async () => {
  const service = new Test()
    .wikimediaService

  expect(service.sanitiseDescription("<span>Hello</span>, world!")).toBe("Hello, world!")
})

test('Removes double spaces' , async () => {
  const service = new Test()
    .wikimediaService

  expect(service.sanitiseDescription("Hello,  world!")).toBe("Hello, world!")
})

test('Removes <br/>' , async () => {
  const service = new Test()
    .wikimediaService

  expect(service.sanitiseDescription("Hello,<br/>world!")).toBe("Hello, world!")
})

test('Removes newline' , async () => {
  const service = new Test()
    .wikimediaService

  expect(service.sanitiseDescription("Hello,\nworld!")).toBe("Hello, world!")
})