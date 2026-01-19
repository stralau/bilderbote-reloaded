import {Attribution, ExtMetadata, ImageInfo} from "../types/types.js";
import {sanitiseText} from "./service.js";
import {htmlToText} from "html-to-text";

export async function attribution(imageInfo: ImageInfo): Promise<Attribution> {

  const extMetadata = imageInfo.extmetadata;

  return {
    author: await sanitiseText(extMetadata.Artist?.value),
    date: getDate(extMetadata),
    licence: extMetadata.LicenseShortName.value,
    licenceUrl: encodeURI(extMetadata.LicenseUrl?.value),
    url: encodeURI(imageInfo.descriptionurl),
  }
}

export function getDate(md: ExtMetadata): string {
  const dateValue = md.DateTimeOriginal?.value ?? md.DateTime?.value;
  return parseDate(dateValue);
}

export function parseDate(dateValue: string) {
  const {datePart, fromWikimedia} = parseWikimediaDateFormat(htmlToText(dateValue))

  console.log("datePart", datePart)
  console.log("fromWikimedia", fromWikimedia)

  if (datePart === undefined) return fromWikimedia

  const date = new Date(datePart)
  let fromDatePart = date.toLocaleDateString('en-GB', {dateStyle: 'long'});
  if(fromDatePart == 'Invalid Date')
    fromDatePart = htmlToText(datePart).replace(/\s+/g, ' ').trim()

  return fromWikimedia && fromDatePart != fromWikimedia ? `${fromDatePart} ${fromWikimedia}` : fromDatePart
}

function parseWikimediaDateFormat(date: string): {datePart?: string, fromWikimedia?: string} {

  const marker = "date QS:"

  const re = new RegExp(`${marker}.[^,]*,`);
  const parts = date.split(re).map(s => s.trim())

  console.log(parts.join(' | '))

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

  const dateParts = [
    ...[day].filter(() => day != 0),
    ...[monthName(monthNumber)].filter(() => monthNumber != 0),
    year,
  ]

  const dateString = dateParts.slice(0, precision - 8).join(' ')

  console.log("textPart", textPart)
  console.log("dateString", dateString)

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