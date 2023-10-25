import {ResponseComposition, ResponseResolver, RestContext, RestRequest} from "msw";

export function withMethod(expectedMethod: string, resolver: ResponseResolver<any, any>) {
  return async (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    // Ignore requests that have a non-JSON body.
    const contentType = req.headers.get('Content-Type') || ''

    if (!contentType.includes('application/json')) {
      return null;
    }

    const actualBody = await req.clone().json()

    if (actualBody.method !== expectedMethod) {
      return null;
    }

    return resolver(req, res, ctx);
  }
}
