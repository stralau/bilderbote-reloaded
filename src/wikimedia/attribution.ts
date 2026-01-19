import {Attribution, ExtMetadata, ImageInfo} from "../types/types.js";
import {sanitiseText} from "./service.js";
import {htmlToText} from "html-to-text";

export async function attribution(imageInfo: ImageInfo): Promise<Attribution> {

  const extMetadata = imageInfo.extmetadata;

  return {
    author: await sanitiseText(extMetadata.Artist?.value),
    date: getDate(extMetadata),
    licence: extMetadata.LicenseShortName.value,
    licenceUrl: extMetadata.LicenseUrl?.value,
    url: imageInfo.descriptionurl,
  }
}

export function getDate(md: ExtMetadata): string {
  const dateValue = md.DateTimeOriginal?.value ?? md.DateTime?.value;
  const date = new Date(dateValue)
  const dateString = date.toLocaleDateString('en-GB', {dateStyle: 'long'});
  if (dateString == 'Invalid Date') return htmlToText(dateValue).replace(/\s+/g, ' ').trim()
  return dateString
}
