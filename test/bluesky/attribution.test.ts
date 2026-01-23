import {BlueskyAttributionEntries as AttributionEntries} from "../../src/bluesky/attribution";

test('Renders attribution', () => {
  const attribution = new AttributionEntries({
      key: "Author",
      value: "Tom Richardson",
      maxLength: 90,
    },
    {
      key: "Date",
      value: "2011-08-22",
      maxLength: 90,
    }, {
      key: "Licence",
      value: "CC BY-SA 2.0",
      maxLength: 90,
      link: "https://creativecommons.org/licenses/by-sa/2.0/"
    }, {
      key: "Source",
      value: "https://commons.wikimedia.org/wiki/File:Mastiles_Gate_and_Lane_-_geograph.org.uk_-_2567679.jpg",
      link: "https://commons.wikimedia.org/wiki/File:Mastiles_Gate_and_Lane_-_geograph.org.uk_-_2567679.jpg"
    }
  )

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

test('Truncates attribution', () => {
  const attribution = new AttributionEntries({
      key: "Author",
      value: "Tom Richardson",
      maxLength: 10,
    },
    {
      key: "Date",
      value: "2011-08-22",
      maxLength: 5,
    }
  )

  expect(attribution.attributionText()).toBe(`Author: To
Date:`)
})

test('Handles multibyte characters', () => {
  const attribution = new AttributionEntries({
      key: "Author", // 6 chars, 6 bytes
      value: "Stralau ❤️", // 9 chars, 14 bytes
    },
    {
      key: "Licence", // 7 chars, 7 bytes
      value: "CC-BÜ-Sя", // 8 chars, 10 bytes
      link: "https://creativecommons.org/licenses/by-sa/2.0/"
    }
  )

  console.log(new TextEncoder().encode("CC-BÜ-Sя").byteLength)

  expect(attribution.attributionText()).toBe(`Author: Stralau ❤️
Licence: CC-BÜ-Sя`)
  expect(attribution.facets()[0].features[0].uri).toBe("https://creativecommons.org/licenses/by-sa/2.0/")
  expect(attribution.facets()[0].index.byteStart).toBe(32)
  expect(attribution.facets()[0].index.byteEnd).toBe(42)
})
