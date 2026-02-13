import {handler} from "../../src/handler.js";

test('posts an image successfully', async () => {
  const result = await handler({})

  expect(result.statusCode).toBe(200)
}, 30_000)