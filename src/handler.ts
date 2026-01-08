import {fetchWikimediaImage} from "./clients/wikimedia";

export const handler = async () => {

  console.log("fetching image")

  let loc = await fetchWikimediaImage()

  return {
    statusCode: 200,
    body: JSON.stringify({ message: loc.response.file.urls.file }),
  };
};
