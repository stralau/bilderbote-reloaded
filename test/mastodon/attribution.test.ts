import {getLength, MastodonAttributionEntries} from "../../src/mastodon/attribution";
import {expect} from "@jest/globals";

test("Calculates length properly", () => {
  expect(getLength("Hello, World")).toBe(12)
})

test("URL length is 23", () => {
  expect(getLength("https://google.com")).toBe(23)
})

test("URLs in text", () => {
  expect(getLength("1: https://google.com , 2: https://google.com")).toBe(3 + 23 + 6 + 23)
})

test("On Mastodon, links are always counted as 23 characters", async () => {
  const entries = new MastodonAttributionEntries({
    author: "Author: Anastas Jovanović",
    date: "1851–52",
    licence: "Public domain",
    licenceUrl: null,
    // very long URL from real life
    url: "https://commons.wikimedia.org/wiki/File:%D0%A1%D1%82%D0%B5%D1%84%D0%B0%D0%BD_%D0%9D%D0%B5%D0%BC%D0%B0%D1%9A%D0%B0_%D0%BF%D1%80%D0%B5%D0%B4%D0%B0%D1%98%D0%B5_%D1%81%D0%B0_%D0%B1%D0%BB%D0%B0%D0%B3%D0%BE%D1%81%D0%BB%D0%BE%D0%B2%D0%BE%D0%BC_%D0%B2%D0%BB%D0%B0%D0%B4%D1%83_%D1%81%D1%80%D0%B1%D1%81%D0%BA%D1%83_%D1%81%D0%B8%D0%BD%D1%83_%D1%81%D0%B2%D0%BE%D0%BC_%D0%A1%D1%82%D0%B5%D1%84%D0%B0%D0%BD%D1%83_%D0%9F%D1%80%D0%B2%D0%BE%D0%B2%D0%B5%D0%BD%D1%87%D0%B0%D0%BD%D0%BE%D0%BC.jpg"
  })

  expect(entries.attributionText()).toBe("" +
    `Author: Author: Anastas Jovanović
Date: 1851–52
Licence: Public domain
Source: https://commons.wikimedia.org/wiki/File:%D0%A1%D1%82%D0%B5%D1%84%D0%B0%D0%BD_%D0%9D%D0%B5%D0%BC%D0%B0%D1%9A%D0%B0_%D0%BF%D1%80%D0%B5%D0%B4%D0%B0%D1%98%D0%B5_%D1%81%D0%B0_%D0%B1%D0%BB%D0%B0%D0%B3%D0%BE%D1%81%D0%BB%D0%BE%D0%B2%D0%BE%D0%BC_%D0%B2%D0%BB%D0%B0%D0%B4%D1%83_%D1%81%D1%80%D0%B1%D1%81%D0%BA%D1%83_%D1%81%D0%B8%D0%BD%D1%83_%D1%81%D0%B2%D0%BE%D0%BC_%D0%A1%D1%82%D0%B5%D1%84%D0%B0%D0%BD%D1%83_%D0%9F%D1%80%D0%B2%D0%BE%D0%B2%D0%B5%D0%BD%D1%87%D0%B0%D0%BD%D0%BE%D0%BC.jpg`)
})
