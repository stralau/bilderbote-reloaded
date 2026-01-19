import {Attribution, ExtMetadata, ImageInfo, map, optional} from "../types/types.js";
import {sanitiseText} from "./service.js";
import {stripHtml} from "@dndxdnd/strip-html";

export async function attribution(imageInfo: ImageInfo): Promise<Attribution> {

  const extMetadata = imageInfo.extmetadata;

  return {
    author: await sanitiseText(extMetadata.Artist?.value),
    date: await getDate(extMetadata),
    licence: extMetadata.LicenseShortName.value,
    licenceUrl: map(optional(extMetadata.LicenseUrl?.value), encodeURI),
    url: encodeURI(imageInfo.descriptionurl),
  }
}

export function getDate(md: ExtMetadata): Promise<string> {
  const dateValue = md.DateTimeOriginal?.value ?? md.DateTime?.value;
  return parseDate(dateValue);
}

async function parseISODate(dateString: string): Promise<string | false> {
  if (dateString.match(/^\d{4}-\d{2}-\d{2}.*/)) {
    const date = new Date(dateString)
    const formattedDate = date.toLocaleDateString('en-GB', {dateStyle: 'long'});
    return formattedDate == 'Invalid Date' ?
      (await stripHtml(dateString)).replace(/\s+/g, ' ').trim()
      : formattedDate
  }
  return false;
}

function parseYearMonth(datePart: string) {
  const match = datePart.match(/^(\d{1,4})-(\d{1,2})$/);
  if (match) {
    const [year, month] = match.slice(1);
    return `${monthName(parseInt(month))} ${year}`
  } else {
    return datePart
  }
}

export async function parseDate(dateValue: string) {
  const {datePart, fromWikimedia} = parseWikimediaDateFormat(await stripHtml(dateValue))

  if (datePart === undefined) return fromWikimedia

  let fromDatePart = await parseISODate(datePart);
  if (fromDatePart === false) {
    fromDatePart = parseYearMonth(datePart);
  }

  return fromWikimedia !== undefined && fromWikimedia.length > 0 && fromDatePart != fromWikimedia ? `${fromDatePart} ${fromWikimedia}` : fromDatePart
}

function parseWikimediaDateFormat(date: string): { datePart?: string, fromWikimedia?: string } {

  const marker = "date QS:"

  const re = new RegExp(`${marker}.[^,]*,`);
  const parts = date.split(re).map(s => s.trim())

  let textPart: string, wikimediaQSPart: string
  if (parts.length == 1) {
    if (date.trim().startsWith(marker)) {
      textPart = ""
      wikimediaQSPart = parts[0]
    } else
      return {datePart: date}
  } else {
    [textPart, wikimediaQSPart] = parts
  }

  let sign = '+'
  if (wikimediaQSPart.startsWith('-')) {
    sign = '-'
    wikimediaQSPart = wikimediaQSPart.slice(1)
  } else if (wikimediaQSPart.startsWith('+')) {
    wikimediaQSPart = wikimediaQSPart.slice(1)
  }

  const dateRegexp = /(\d{1,4})(-\d{1,2})?(-\d{1,2})?(T\d{2}:\d{2}:\d{2}Z?)?(\/\d{1,2})?/

  const match = wikimediaQSPart.match(dateRegexp);

  if (!match) return {datePart: textPart};

  const [yearPart, monthPart, dayPart, timePart, precisionPart] = match.slice(1);

  if (!yearPart) {
    return {datePart: textPart};
  }

  const year = sign === '-' ? `${yearPart} BCE` : yearPart;
  const monthNumber = parseInt(monthPart.slice(1) ?? "0");
  // Wikimedia precision: 9 = year, 10 = month, 11 = day
  const precision = parseInt(precisionPart?.slice(1) ?? "11")
  const day = parseInt(dayPart.slice(1) ?? "0");

  const dateString = [
    year,
    ...[monthName(monthNumber)].filter(() => monthNumber != 0),
    ...[day].filter(() => day != 0).toString(),
  ].slice(0, precision - 8).reverse().join(' ')

  return textPart == dateString ?
    {fromWikimedia: dateString} : {datePart: textPart != "" ? textPart : undefined, fromWikimedia: dateString}
}

function monthName(mm: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return months[mm - 1] ?? mm.toString();
}