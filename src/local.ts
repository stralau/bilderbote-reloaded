import {repostHandler} from "./repostHandler.js";
import {handler as imageHandler} from "./handler.js";

(async () => {
  const handlerName = process.argv[2]
  let handler: () => Promise<any>;

  switch (handlerName) {
    case 'image':
      handler = imageHandler
      break;
    case 'repost':
      handler = repostHandler
  }

  const res = await handler();
  console.log(res);
})();