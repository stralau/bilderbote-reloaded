import {fetchRandomFileLocation} from "./clients/wikimedia";

export const handler = async () => {

  let loc = await fetchRandomFileLocation()

  return {
    statusCode: 200,
    body: JSON.stringify({ message: loc }),
  };
};
