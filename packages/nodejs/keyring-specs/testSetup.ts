import { Crypto } from "@peculiar/webcrypto"

import fetch, {
  Headers,
  Request,
  Response,
} from 'node-fetch'


// @ts-ignore
global.crypto = new Crypto()

// @ts-ignore
if (!globalThis.fetch) {
  // @ts-ignore
  globalThis.fetch = fetch
  // @ts-ignore
  globalThis.Headers = Headers
  // @ts-ignore
  globalThis.Request = Request
  // @ts-ignore
  globalThis.Response = Response
}
