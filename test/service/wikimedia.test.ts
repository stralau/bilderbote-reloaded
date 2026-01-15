import {expect} from "@jest/globals";
import {Test, withImageInfo} from "./TestHelpers";
import {ImageInfoResponse} from "../../src/types/types";

test('Fetches image', async () => {

  const service = new Test()
    .withWikimediaFile("ISS039-E-14528_-_View_of_Earth.jpg")
    .wikimediaService

  const image = await service.fetchWikimediaObject()

  expect(image).toBeDefined()
  expect(image.description).toBe("View of Earth taken during ISS Expedition 39.")
  expect(image.attribution.author).toBe("Earth Science and Remote Sensing Unit, Lyndon B. Johnson Space Center")
  expect(image.attribution.date).toBe("21 April 2014")
  expect(image.attribution.licence).toBe("Public domain")
  expect(image.attribution.url).toBe("https://commons.wikimedia.org/wiki/File:ISS039-E-14528_-_View_of_Earth.jpg")
})

test('Take file title if no description', async () => {

  const service = new Test()
    .wikimediaService

  return (await withImageInfo("no-description")) (async (imageInfo: ImageInfoResponse) => {
    const extMetadata = imageInfo.query.pages[0].imageinfo[0].extmetadata
    const description = await service.getDescription(extMetadata)

    expect(description).toEqual(extMetadata.ObjectName.value)
  })
})

test('Sanitises description' , async () => {
  const service = new Test()
    .wikimediaService

  return (await withImageInfo("html-description-with-newlines")) ((imageInfo: ImageInfoResponse) => {
    const extMetadata = imageInfo.query.pages[0].imageinfo[0].extmetadata
    service.getDescription(extMetadata).then((desc: string) =>
      expect(desc).toEqual("Objectgegevens Titel: Tinnen figuur in de vorm van Franse trompettist (kurassier) te paard Beschrijving: Tinnen beeldje met een groen geschilderd voetstuk. Het beeldje stelt een Franse kurassier, meer in het bijzonder een trompettist te paard rond 1812-1815 voor. Het paard gaat stapvoets. De berijder heeft de teugels in zijn linkerhand en de goudkleurige trompet in de rechterhand. Het mondstuk staat aan de mond. Het beeldje is als volgt geverfd: blauwe wapenrok met rode epauletten, zilverkleurige kuras, witte broek, zwarte laarzen, goudkleurige helm met zwarte paardenstaart. Gewapend met sabel. Het paard is wit met een lange staart en heeft een zwart tuig en een blauw dekkleed met witte biezen. Trefwoorden: karakterspeelgoed, speelgoed, ontspanningsmiddel Vervaardiger: Allgeyer Plaats vervaardiging: Duitsland, Fürth Datering: 1860 - 1880 Technieken: gegoten, beschilderd Materiaal: metaal, tin, lood, verf Afmetingen: (cm) hg 4,1 / br 3,2 / dp 0,9 Associatie: tinnen soldaatje, afgietsel, figuur, figuurvoorstelling, , cavalerie, kurassier, leger, oorlog, Napoleon I, 1812-1815, militaria, spelen, communicatie, bevel, muziek Vorm & decoratie: soldaat, kurassier, trompettist, wapenrok, epaulet, kuras, helm, paardenstaart, pluim, sabel, paard, dier, trompet, musicus Inventarisnr: Museum Rotterdam 90005")
    )
  })
})

test('Renders date correctly', async () => {
  const service = new Test()
    .wikimediaService

  return (await withImageInfo("no-description")) ((imageInfo: ImageInfoResponse) => {
    const extMetadata = imageInfo.query.pages[0].imageinfo[0].extmetadata
    expect(service.getDate(extMetadata)).toEqual("26 August 2015")
  })
})

test('Keeps unparsable date unchanged', async () => {
  const service = new Test()
    .wikimediaService

  return (await withImageInfo("html-description-with-newlines")) ((imageInfo: ImageInfoResponse) => {
    const extMetadata = imageInfo.query.pages[0].imageinfo[0].extmetadata
    expect(service.getDate(extMetadata)).toEqual("between 1860 and 1880 date QS:P,+1850-00-00T00:00:00Z/7,P1319,+1860-00-00T00:00:00Z/9,P1326,+1880-00-00T00:00:00Z/9")
  })
})


test('Removes html' , async () => {
  const service = new Test()
    .wikimediaService

  expect(await service.sanitiseText("<span>Hello</span>, world!")).toBe("Hello, world!")
})

test('Removes double spaces' , async () => {
  const service = new Test()
    .wikimediaService

  expect(await service.sanitiseText("Hello,  world!")).toBe("Hello, world!")
})

test('Removes <br/>' , async () => {
  const service = new Test()
    .wikimediaService

  expect(await service.sanitiseText("Hello,<br/>world!")).toBe("Hello,world!")
})

test('Removes newline' , async () => {
  const service = new Test()
    .wikimediaService

  expect(await service.sanitiseText("Hello,\nworld!")).toBe("Hello, world!")
})
