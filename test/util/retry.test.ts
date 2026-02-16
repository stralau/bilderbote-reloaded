import {retry} from "../../src/util/Retry";

test("Retries until successful", () => {
  const start = 3
  let counter = start

  const countDownAndSucceed = async () => {
    counter--
    if (counter > 0) throw new Error(`Failed at attempt ${start - counter}`)
    return "success"
  };

  const r = retry({
    attempts: 3,
    fn: countDownAndSucceed
  });

  expect(async () => (await r).get()).resolves.toBe("success")
})

test("Fails with proper error", () => {

  const start = 3
  let counter = start

  const countDownAndFail = async () => {
    counter--
    throw new Error(`Failed at attempt ${start - counter}`)
  };

  const r = retry({
    attempts: 3,
    fn: countDownAndFail
  });

  expect(async () => (await r).get()).rejects.toThrow("Failed at attempt 3")

})