import {BlueskyAttributionEntries as AttributionEntries} from "../../src/bluesky/attribution";
import {utf8Length} from "../../src/util/attributionEntries";

test('Renders attribution', () => {
  const attribution = new AttributionEntries({
    author: "Tom Richardson",
    date: "2011-08-22",
    licence: "CC BY-SA 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    url: "https://commons.wikimedia.org/wiki/File:Mastiles_Gate_and_Lane_-_geograph.org.uk_-_2567679.jpg"
  })

  expect(attribution.attributionText()).toBe(
    `Author: Tom Richardson
Date: 2011-08-22
Licence: CC BY-SA 2.0
Source: https://commons.wikimedia.org/wiki/File:Mastiles_Gate_and_Lane_-_geograph.org.uk_-_2567679.jpg`
  )
  expect(attribution.facets()).toHaveLength(2)
  expect(attribution.facets()[1].features[0].uri).toBe("https://commons.wikimedia.org/wiki/File:Mastiles_Gate_and_Lane_-_geograph.org.uk_-_2567679.jpg")
  expect(attribution.facets()[0].features[0].uri).toBe("https://creativecommons.org/licenses/by-sa/2.0/")
  expect(attribution.facets()[0].index.byteStart).toBe(49)
  expect(attribution.facets()[0].index.byteEnd).toBe(61)
  expect(attribution.facets()[1].index.byteStart).toBe(70)
  expect(attribution.facets()[1].index.byteEnd).toBe(164)
})

test('Handles multibyte characters', () => {
  const attribution = new AttributionEntries({
      author: "Stralau ❤️", // Author – 6 chars, 6 bytes, Stralau ❤️ – 9 chars, 14 bytes
      date: null,
      url: null,
      licence: "CC-BÜ-Sя", // Licence 7 chars, 7 bytes, CC-BÜ-Sя – 8 chars, 10 bytes
      licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0/"
    }
  )

  expect(attribution.attributionText()).toBe(`Author: Stralau ❤️
Licence: CC-BÜ-Sя`)
  expect(attribution.facets()[0].features[0].uri).toBe("https://creativecommons.org/licenses/by-sa/2.0/")
  expect(attribution.facets()[0].index.byteStart).toBe(32)
  expect(attribution.facets()[0].index.byteEnd).toBe(42)
})

test('Gets the right position for the facets even when shortening fields', () => {
  const attribution = new AttributionEntries({
    author: "Lorentz, Alcide Joseph (Paris, 25–02–1813 - après 1858), dessinateur-lithographe",
    date: "Unknown",
    licence: "CC0",
    licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    url: "https://commons.wikimedia.org/wiki/File:12._Proclamation._Citoyennes.La_patrie_est_en_danger,_la_noce_est_morte._G.31374.jpg"
  })

  const untilLicence = /(.*Licence:\s*)/ms.exec(attribution.attributionText())[0] || ""
  const licenceEnd = /(.*Licence:\s*\S*)/ms.exec(attribution.attributionText())[0] || ""
  const untilSource = /(.*Source:\s*)/ms.exec(attribution.attributionText())[0] || ""

  expect(attribution.facets()).toHaveLength(2)
  expect(attribution.facets()[0].features[0].uri).toBe("http://creativecommons.org/publicdomain/zero/1.0/deed.en")
  expect(attribution.facets()[1].features[0].uri).toBe("https://commons.wikimedia.org/wiki/File:12._Proclamation._Citoyennes.La_patrie_est_en_danger,_la_noce_est_morte._G.31374.jpg")
  expect(attribution.facets()[0].index.byteStart).toBe(utf8Length(untilLicence))
  expect(attribution.facets()[0].index.byteEnd).toBe(utf8Length(licenceEnd))
  expect(attribution.facets()[1].index.byteStart).toBe(utf8Length(untilSource))
  expect(attribution.facets()[1].index.byteEnd).toBe(utf8Length(attribution.attributionText()))
})