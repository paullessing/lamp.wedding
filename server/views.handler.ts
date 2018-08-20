import { APIGatewayEvent, Context, ProxyResult } from 'aws-lambda';
import { makeResponse } from './util/http-helpers';
import { guestsTable } from './db/guests.table';

export async function logView(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  const body = JSON.parse(event.body);
  const email = body && body.email;

  if (!email) {
    return makeResponse(400);
  }

  const users = await guestsTable.search((lookup) => {
    return lookup.email === email.toLocaleLowerCase();
  });

  if (users.length !== 1) {
    return makeResponse(404);
  }

  const user = users[0];
  if (!user.viewedSaveTheDate) {
    user.viewedSaveTheDate = new Date().toISOString();
    await guestsTable.put(user);
  }

  return makeResponse(204);
}
