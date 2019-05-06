import { APIGatewayEvent, Context, ProxyResult } from 'aws-lambda';
import { makeResponse } from './util/http-helpers';
import { guestsTable } from './db/guests.table';
import { DateString } from '../shared/guest.model';

export async function logView(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  const body: any = JSON.parse(event.body || '{}');
  const email = body && body.email;

  if (!email) {
    return makeResponse(400);
  }

  console.log('Got an email', email);

  const users = await guestsTable.search((lookup) => {
    return lookup.email === email.toLocaleLowerCase();
  });

  if (users.length !== 1) {
    return makeResponse(404);
  }

  const user = users[0];
  if (!user.viewedSaveTheDate) {
    user.viewedSaveTheDate = DateString.convert(new Date());
    await guestsTable.put(user);
  }

  return makeResponse(204);
}
