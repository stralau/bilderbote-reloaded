export async function fetchRandomFileLocation(): Promise<string> {
  const res = await fetch('https://en.wikipedia.org/wiki/Special:Random')

  if(!res.ok) throw new Error(
    `Failed to fetch random file location: ${res.status} ${res.statusText}`
  )
  return res.headers.get('Location') || ''
}