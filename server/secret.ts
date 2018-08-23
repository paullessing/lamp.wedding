import { makeResponse } from './util/http-helpers';
import { APIGatewayEvent } from 'aws-lambda';
import { config } from '../config/config';

export function ensureSecret(event: APIGatewayEvent): void {
  const authHeader = event.headers && (event.headers['X-Auth-Token'] || event.headers['x-auth-token']);
  if (authHeader !== config.apiSecret) {
    console.warn(`Invalid X-Auth-Token header`);
    throw makeResponse(401, 'Unauthenticated');
  }
}
