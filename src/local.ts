import {handler} from "./handler";

(async () => {
  const res = await handler();
  console.log(res);
})();