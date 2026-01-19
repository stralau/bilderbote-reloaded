import {expect} from "@jest/globals";
import {Test, withImageInfo} from "./TestHelpers";
import {ImageInfoResponse} from "../../src/types/types";
import {sanitiseText} from "../../src/wikimedia/service";
import {getDate, parseDate} from "../../src/wikimedia/attribution";

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
  new Test()
    .wikimediaService;
  return (await withImageInfo("no-description")) (async (imageInfo: ImageInfoResponse) => {
    const extMetadata = imageInfo.query.pages[0].imageinfo[0].extmetadata
    expect(await getDate(extMetadata)).toEqual("26 August 2015")
  })
})

test('Strips unparsable date', async () => {
  new Test()
    .wikimediaService;

  return (await withImageInfo("html-description-with-newlines")) (async (imageInfo: ImageInfoResponse) => {
    const extMetadata = imageInfo.query.pages[0].imageinfo[0].extmetadata
    expect(await getDate(extMetadata)).toEqual("between 1860 and 1880")
  })
})


test('Removes html' , async () => {
  expect(await sanitiseText("<span>Hello</span>, world!")).toBe("Hello, world!")
})

test('Removes double spaces' , async () => {
  expect(await sanitiseText("Hello,  world!")).toBe("Hello, world!")
})

test('Removes <br/>' , async () => {
  expect(await sanitiseText("Hello,<br/>world!")).toBe("Hello,world!")
})

test('Removes newline' , async () => {
  expect(await sanitiseText("Hello,\nworld!")).toBe("Hello, world!")
})

test('Strips HTML from empty string' , async () => {
  expect(await sanitiseText("")).toBe("")
})

test('Parses date correctly', async () => {
  expect (await parseDate("in the year date QS:P571,+1797-00-00T00:00:00Z/9")).toBe("in the year 1797")
})

test('Don’t show the parsed year if it is the same as the text year', async () => {
  expect (await parseDate("1797 date QS:P571,+1797-00-00T00:00:00Z/9")).toBe("1797")
})

test('Don’t show the parsed date if it is the same as the text date', async () => {
  expect (await parseDate("1797-01-01 date QS:P571,+1797-01-01T00:00:00Z/11")).toBe("1 January 1797")
})

test('Parse date without text', async () => {
  expect (await parseDate("date QS:P571,+1797-00-00T00:00:00Z/9")).toBe("1797")
})

test('Parse date without sign', async () => {
  expect (await parseDate("date QS:P571,1797-00-00T00:00:00Z/9")).toBe("1797")
})

test('Show year only if month is missing, even with months precision', async () => {
  expect (await parseDate("date QS:P571,1797-00-00T00:00:00Z/10")).toBe("1797")
})

test('Show month if exists with months precision', async () => {
  expect (await parseDate("date QS:P571,1797-03-00T00:00:00Z/10")).toBe("March 1797")
})

test('Show month only if month is missing, even with days precision', async () => {
  expect (await parseDate("date QS:P571,1797-03-00T00:00:00Z/11")).toBe("March 1797")
})

test('Show day if exists with day precision', async () => {
  expect (await parseDate("date QS:P571,1797-05-07T00:00:00Z/11")).toBe("7 May 1797")
})

test('Don’t show day with month precision', async () => {
  expect (await parseDate("date QS:P571,1797-05-07T00:00:00Z/10")).toBe("May 1797")
})

test('Don’t show month with year precision', async () => {
  expect (await parseDate("date QS:P571,1797-05-07T00:00:00Z/9")).toBe("1797")
})

test('BCE date', async () => {
  expect (await parseDate("date QS:P571,-1797-00-00T00:00:00Z/9")).toBe("1797 BCE")
})

test('Parse ISO date', async () => {
  expect (await parseDate("2025-12-03")).toBe("3 December 2025")
})

test('Parse ISO date with time', async () => {
  expect (await parseDate("2025-12-03T12:04:15Z")).toBe("3 December 2025")
})

test("Leave a year without month and day unchanged", async () => {
  expect(await parseDate("1999")).toBe("1999")
})
test("Render year and month without day", async () => {
  expect(await parseDate("1999-05")).toBe("May 1999")
})