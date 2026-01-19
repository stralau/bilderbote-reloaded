import {Attribution, ExtMetadata, ImageInfo} from "../types/types.js";
import {sanitiseText} from "./service.js";
import {stripHtml} from "@dndxdnd/strip-html";

export async function attribution(imageInfo: ImageInfo): Promise<Attribution> {

  const extMetadata = imageInfo.extmetadata;

  return {
    author: await sanitiseText(extMetadata.Artist?.value),
    date: await getDate(extMetadata),
    licence: extMetadata.LicenseShortName.value,
    licenceUrl: encodeURI(extMetadata.LicenseUrl?.value),
    url: encodeURI(imageInfo.descriptionurl),
  }
}

export function getDate(md: ExtMetadata): Promise<string> {
  const dateValue = md.DateTimeOriginal?.value ?? md.DateTime?.value;
  return parseDate(dateValue);
}

export async function parseDate(dateValue: string) {
  const {datePart, fromWikimedia} = parseWikimediaDateFormat(await stripHtml(dateValue))

  if (datePart === undefined) return fromWikimedia

  const date = new Date(datePart)
  let fromDatePart = date.toLocaleDateString('en-GB', {dateStyle: 'long'});
  if(fromDatePart == 'Invalid Date')
    fromDatePart = (await stripHtml(datePart)).replace(/\s+/g, ' ').trim()

  return fromWikimedia !== undefined && fromWikimedia.length > 0 && fromDatePart != fromWikimedia ? `${fromDatePart} ${fromWikimedia}` : fromDatePart
}

function parseWikimediaDateFormat(date: string): {datePart?: string, fromWikimedia?: string} {

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
  const precision = parseInt(precisionPart?.slice(1) ?? "9")
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