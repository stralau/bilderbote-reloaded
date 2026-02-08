import {repostHandler} from "./repostHandler.js";
import {handler as imageHandler} from "./handler.js";

(async () => {
  const args = process.argv.slice(2);
  const handlerName = args[0]
  let handler: () => Promise<any>;

  switch (handlerName) {
    case 'image':
      if (args.length > 1) {
        handler = () => imageHandler({location: args[1]})
      } else
        handler = () => imageHandler({});
      break;
    case 'repost':
      handler = repostHandler
  }

  const res = await handler();
  console.log(res);
})();