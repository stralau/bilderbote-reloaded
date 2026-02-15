import {expect} from "@jest/globals";
import {Test, withImageInfo} from "./TestHelpers";
import {ImageInfoResponse} from "../../src/types/types";
import {getDate, parseDate} from "../../src/wikimedia/attribution";
import {sanitiseText} from "../../src/util/text";

test('Fetches image', async () => {

  const service = new Test()
    .withWikimediaFile("ISS039-E-14528_-_View_of_Earth.jpg")
    .wikimediaService

  const image = await service.fetchWikimediaObject()

  expect(image).toBeDefined()
  const metadata = image.metadata
  expect(metadata.description).toBe("View of Earth taken during ISS Expedition 39.")
  expect(metadata.attribution.author).toBe("Earth Science and Remote Sensing Unit, Lyndon B. Johnson Space Center")
  expect(metadata.attribution.date).toBe("21 April 2014")
  expect(metadata.attribution.licence).toBe("Public domain")
  expect(metadata.attribution.url).toBe("https://commons.wikimedia.org/wiki/File:ISS039-E-14528_-_View_of_Earth.jpg")
})

test('Take file title if no description', async () => {

  const service = new Test()
    .wikimediaService

  return (await withImageInfo("no-description")) (async (imageInfo: ImageInfoResponse) => {
    const description = await service.getDescription(imageInfo.query.pages[0].imageinfo[0])

    expect(description).toEqual(imageInfo.query.pages[0].imageinfo[0].extmetadata.ObjectName.value)
  })
})

test('Falls back to filename if no description', async () => {

  const service = new Test()
    .wikimediaService

  const description = await service.getDescription({
    filename: "Example.jpg",
    extmetadata: {},
  } as any)

  expect(description).toEqual("Example.jpg")
})

test('Sanitises description' , async () => {
  const service = new Test()
    .wikimediaService

  return (await withImageInfo("html-description-with-newlines")) ((imageInfo: ImageInfoResponse) => {
    service.getDescription(imageInfo.query.pages[0].imageinfo[0]).then((desc: string) =>
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
  expect(sanitiseText("<span>Hello</span>, world!")).toBe("Hello, world!")
})

test('Removes double spaces' , async () => {
  expect(sanitiseText("Hello,  world!")).toBe("Hello, world!")
})

test('Removes <br/>' , async () => {
  expect(sanitiseText("Hello,<br/>world!")).toBe("Hello, world!")
})

test('Removes newline' , async () => {
  expect(sanitiseText("Hello,\nworld!")).toBe("Hello, world!")
})

test('Strips HTML from empty string' , async () => {
  expect(sanitiseText("")).toBe("")
})

test('Strips HTML including <style> elements', async () => {
  expect(sanitiseText('<style data-mw-deduplicate=\\"TemplateStyles:r1120359340\\">.mw-parser-output .messagebox{margin:4px 0;width:auto;border-collapse:collapse;border:2px solid var(--border-color-progressive,#6485d1);background-color:var(--background-color-neutral-subtle,#fbfcff);color:var(--color-base,#202122);box-sizing:border-box;border-inline-start-width:8px}.mw-parser-output .messagebox.mbox-small{font-size:88%;line-height:1.25em}.mw-parser-output .mbox-warning,.mw-parser-output .mbox-speedy{border:2px solid var(--border-color-error,#b22222);background:var(--background-color-error-subtle,#ffdbdb);border-inline-start-width:8px}.mw-parser-output .mbox-serious,.mw-parser-output .mbox-delete,.mw-parser-output .mbox-stop{border:2px solid var(--border-color-error,#b22222);border-inline-start-width:8px}.mw-parser-output .mbox-issue,.mw-parser-output .mbox-content{border:2px solid #f28500;background:var(--background-color-warning-subtle,#ffe);border-inline-start-width:8px}.mw-parser-output .mbox-query,.mw-parser-output .mbox-style{border:2px solid #f4c430;background:var(--background-color-warning-subtle,#ffe);border-inline-start-width:8px}.mw-parser-output .mbox-shit{border:2px solid #960;border-inline-start-width:8px}.mw-parser-output .mbox-license{border:2px solid #88a;border-inline-start-width:initial}.mw-parser-output .mbox-legal{border:2px solid var(--border-color-notice,#666);background:var(--background-color-base,#fff);border-inline-start-width:8px}.mw-parser-output .mbox-honor{border:2px solid #ca3;background:var(--background-color-warning-subtle,#fcf4db);border-inline-start-width:8px}.mw-parser-output .mbox-growth{border:2px solid #8d4;background:var(--background-color-success-subtle,#d5fdf4);border-inline-start-width:8px}.mw-parser-output .mbox-move{border:2px solid #93c;border-inline-start-width:8px}.mw-parser-output .mbox-protection,.mw-parser-output .mbox-message{border:2px solid var(--border-color-base,#aaa);border-inline-start-width:8px}.mw-parser-output .messagebox .mbox-text{border:none;padding:0.25em 0.9em;width:100%}.mw-parser-output .messagebox .mbox-image{border:none;padding:2px 0 2px 0.9em;text-align:center}.mw-parser-output .messagebox .mbox-imageright{border:none;padding:2px 0.9em 2px 0;text-align:center}.mw-parser-output .messagebox .mbox-empty-cell{border:none;padding:0;width:1px}.mw-parser-output .messagebox .mbox-invalid-type{text-align:center}@media(min-width:720px){.mw-parser-output .messagebox{margin:4px 10%}.mw-parser-output .messagebox.mbox-small{clear:right;float:right;margin:4px 0 4px 1em;width:238px}}body.skin--responsive .mw-parser-output table.messagebox img{max-width:none!important}</style><table class=\\"plainlinks messagebox mbox-message\\" role=\\"presentation\\"><tbody><tr><td class=\\"mbox-image\\"><span typeof=\\"mw:File\\"><a href=\\"//commons.wikimedia.org/wiki/File:Wikidata-logo.svg\\" class=\\"mw-file-description\\"><img src=\\"https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Wikidata-logo.svg/40px-Wikidata-logo.svg.png\\" decoding=\\"async\\" width=\\"30\\" height=\\"17\\" class=\\"mw-file-element\\" srcset=\\"https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Wikidata-logo.svg/60px-Wikidata-logo.svg.png 1.5x\\" data-file-width=\\"1050\\" data-file-height=\\"590\\"></a></span></td><td class=\\"mbox-text\\"><a href=\\"https://www.wikidata.org/wiki/Wikidata:Main_page\\" class=\\"extiw\\" title=\\"wikidata:Wikidata:Main page\\">Wikidata</a> has <a href=\\"https://www.wikidata.org/wiki/Q22953444\\" class=\\"extiw\\" title=\\"d:Q22953444\\">entry Chapelle des Pénitents blancs de Narbonne <small>(Q22953444)</small></a> with data related to this item.</td></tr></tbody></table>'))
    .toBe("Wikidata has entry Chapelle des Pénitents blancs de Narbonne (Q22953444) with data related to this item.")
})
