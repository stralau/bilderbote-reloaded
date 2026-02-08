import {AttributionEntries} from "../../src/util/attributionEntries";


test("Respects max length", () => {
  const entries = new AttributionEntries({
    author: "Tom Richardson",
    date: "2011-08-22",
    licence: "CC BY-SA 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    url: "https://commons.wikimedia.org/wiki/File:Mastiles_Gate_and_Lane_-_geograph.org.uk_-_2567679.jpg"
  }, 30)

  expect(entries.attributionText()).toBe(
    `Author: Tom Richardson
Date: 2`
  )
})

test("Works with null author", () => {
  const entries = new AttributionEntries({
    author: null,
    date: "2011-08-22",
    licence: "CC BY-SA 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    url: "https://commons.wikimedia.org/wiki/File:Mastiles_Gate_and_Lane_-_geograph.org.uk_-_2567679.jpg"
  }, 30)

  expect(entries.attributionText()).toBe(
    `Date: 2011-08-22
Licence: CC B`
  )
})