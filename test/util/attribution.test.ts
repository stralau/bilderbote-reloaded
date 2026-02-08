import {AttributionEntries} from "../../src/util/attributionEntries";
import {expect} from "@jest/globals";
import {parseDate} from "../../src/wikimedia/attribution";


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

test('If precision is missing, derive it from the date string – year', async () => {
  expect (await parseDate("date QS:P571,1797-00-00")).toBe("1797")
})

test('If precision is missing, derive it from the date string – month', async () => {
  expect (await parseDate("date QS:P571,1797-05-00")).toBe("May 1797")
})

test('If precision is missing, derive it from the date string – day', async () => {
  expect (await parseDate("date QS:P571,1797-05-07")).toBe("7 May 1797")
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
