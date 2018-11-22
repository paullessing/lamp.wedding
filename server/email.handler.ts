import { APIGatewayEvent, Context, ProxyResult } from 'aws-lambda';
import { SaveTheDateEmailData, sendSaveTheDateEmail, sendSaveTheDate2Email } from './email';
import { ensureSecret } from './secret';
import { guestsTable } from './db/guests.table';
import { Guest, Uuid } from '../shared/guest.model';

export async function sendTest(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  const body = await sendSaveTheDateEmail({
    names: ['Paul', 'Lam'],
    emails: ['lessing.paul+paul@gmail.com', 'lessing.paul+lam@gmail.com']
  });

  return {
    statusCode: 200,
    body: JSON.stringify(body)
  };
}

export async function sendSaveTheDate(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  if (2 + 2 === 4) throw new Error('Cannot call this');
  ensureSecret(event);

  const ids = event.body && event.body.split('\n') || [];

  const guests = (await guestsTable.all())
    .sort((a, b) => a.index - b.index)
    .filter((guest) => !ids.length || ids.indexOf(guest.id) >= 0);

  const groups: Guest[][] = [];
  for (const guest of guests) {
    if (!guest.groupId) {
      groups.push([guest]);
    } else {
      const group = groups.find((group) => group[0].groupId === guest.groupId);
      if (group) {
        group.push(guest);
      } else {
        groups.push([guest]);
      }
    }
  }

  const groupsWithoutEmails: Guest[][] = [];

  const emails: SaveTheDateEmailData[] = groups.map((group): SaveTheDateEmailData => ({
    emails: group.map((guest) => guest.email).filter((email) => !!email),
    names: group.map((guest) => guest.firstName),
  })).filter((email, index) => {
    const noEmails = email.emails.length === 0;
    if (noEmails) {
      groupsWithoutEmails.push(groups[index]);
    }
    return !noEmails;
  });

  const notSentList = groupsWithoutEmails.map((guests) => guests.map((guest) =>
    `${guest.firstName}${guest.lastName ? ' ' + guest.lastName : ''}`
  ).join(' and ')).join('\n');

  const results = await Promise.all(emails.map((email) => {
    return sendSaveTheDateEmail(email).then(() => ({
      success: true,
      names: email.names.join(' and '),
      emails: email.emails.join(', ')
    })).catch((e) => {
      console.log('Failed to send: ' + email.emails.join(', '), e);
      return {
        success: false,
        names: email.names.join(' and '),
        emails: email.emails.join(', ')
      };
    });
  }));

  const successes = results.filter((result) => result.success).map((success) => `${success.names} (${success.emails})`);
  const failures = results.filter((result) => !result.success).map((success) => `${success.names} (${success.emails})`);

  const result =
`Successfully sent ${successes.length} emails:
${successes.join('\n')}

Failed to send ${failures.length} emails:
${failures.join('\n')}

The following recipients had no email attached:
${notSentList}`;

  return {
    statusCode: failures.length ? 500: 200,
    body: result,
    headers: {
      'Content-Type': 'text/plain'
    }
  };
}

export async function sendSaveTheDate2(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  ensureSecret(event);

  const ids = event.body && event.body.split('\n') || [];

  const allGuests = await guestsTable.all();

  const guests = allGuests
    .sort((a, b) => a.index - b.index)
    .filter((guest) => !ids.length || ids.indexOf(guest.id) >= 0);

  const groups: Guest[][] = [];
  for (const guest of guests) {
    if (!guest.groupId) {
      groups.push([guest]);
    } else {
      const group = groups.find((group) => group[0].groupId === guest.groupId);
      if (group) {
        group.push(guest);
      } else {
        groups.push([guest]);
      }
    }
  }

  const groupsWithoutEmails: Guest[][] = [];

  const emails: SaveTheDateEmailData[] = groups.map((group): SaveTheDateEmailData => ({
    emails: group.map((guest) => guest.email).filter((email) => !!email),
    names: group.map((guest) => guest.firstName),
  })).filter((email, index) => {
    const noEmails = email.emails.length === 0;
    if (noEmails) {
      groupsWithoutEmails.push(groups[index]);
    }
    return !noEmails;
  });

  const notSentList = groupsWithoutEmails.map((guests) => guests.map((guest) =>
    `${guest.firstName}${guest.lastName ? ' ' + guest.lastName : ''}`
  ).join(' and ')).join('\n');

  const results = await Promise.all(emails.map((email) => {
    return sendSaveTheDate2Email(email).then(() => ({
      success: true,
      names: email.names.join(' and '),
      emails: email.emails.join(', ')
    })).catch((e) => {
      console.log('Failed to send: ' + email.emails.join(', '), e);
      return {
        success: false,
        names: email.names.join(' and '),
        emails: email.emails.join(', ')
      };
    });
  }));

  const successes = results.filter((result) => result.success).map((success) => `${success.names} (${success.emails})`);
  const failures = results.filter((result) => !result.success).map((success) => `${success.names} (${success.emails})`);

  const result =
    `Successfully sent ${successes.length} emails:
${successes.join('\n')}

Failed to send ${failures.length} emails:
${failures.join('\n')}

The following recipients had no email attached:
${notSentList}`;

  return {
    statusCode: failures.length ? 500: 200,
    body: result,
    headers: {
      'Content-Type': 'text/plain'
    }
  };
}
