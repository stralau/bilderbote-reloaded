import {parseHTML} from "linkedom";

export const sanitiseText = (text: string): string => {

  const html = `<html lang=\"en\"><body>${text}</body></html>`

  const dom = parseHTML(html);
  const document = dom.window.document

  document.querySelectorAll('script, style').forEach(el => el.remove())
  document.querySelectorAll('br').forEach(br => {
    br.replaceWith(document.createTextNode('\n'));
  });

  return document.body?.textContent?.replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim() ?? text;
}
