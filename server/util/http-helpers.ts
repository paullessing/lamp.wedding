import { APIGatewayEvent, Callback, Context, Handler, ProxyResult } from 'aws-lambda';

export type ProxyHandler = (event: APIGatewayEvent, context: Context) => ProxyResult | Promise<ProxyResult>;

export function makeResponse(statusCode: number, body?: any, headers: { [header: string]: string } = {}): ProxyResult {
  return {
    statusCode,
    body: (body !== null && typeof body !== 'undefined') ? JSON.stringify(body) : undefined,
    headers: {
      'Access-Control-Allow-Origin' : '*', // TODO scope
      ...headers
    }
  };
}

export function createRequestHandler(handler: ProxyHandler): Handler {
  return (event: APIGatewayEvent, context: Context, callback: Callback): void => {
    Promise.resolve()
      .then(() => handler(event, context))
      .catch((error: any) => {
        if (error.statusCode && error.hasOwnProperty('body')) {
          return error;
        } else {
          console.error(error);
          const response: ProxyResult = {
            statusCode: 500,
            body: 'Server Error'
          };
          return response;
        }
      })
      .then((result: ProxyResult) => {
        callback(null, result);
      });
  };
}

export function parseBody(body: string | null): any {
  if (!body) {
    return body;
  }

  try {
    return JSON.parse(body);
  } catch (e) {
    throw makeResponse(400, 'Bad Request');
  }
}
