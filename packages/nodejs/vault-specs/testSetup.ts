import { Crypto } from "@peculiar/webcrypto"

import fetch, {
  Headers,
  Request,
  Response,
} from 'node-fetch'


Object.defineProperty(global, "crypto", {
  value: new Crypto(),
});

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
