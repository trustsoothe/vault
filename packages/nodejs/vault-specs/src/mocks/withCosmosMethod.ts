import {ResponseComposition, ResponseResolver, RestContext, RestRequest} from "msw";

export function withCosmosMethod(expectedMethod: string, resolver: ResponseResolver<any, any>, path?: string) {
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

    if (path && actualBody.params?.path !== path) {
      return null;
    }

    return resolver(req, res, ctx);
  }
}
