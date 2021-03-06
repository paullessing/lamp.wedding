import { APIGatewayEvent, Context, ProxyResult } from 'aws-lambda';
import { config } from '../config/config';
import { isFullRsvp } from '../shared';
import { Guest, GuestId } from '../shared/guest.model';
import { guestsTable } from './db/guests.table';
import { rsvpTable } from './db/rsvp.table';
import {
  ReminderEmailData,
  SaveTheDateEmailData,
  sendOneMonthEmail,
  sendReminderEmail,
  sendSaveTheDate2Email,
  sendSaveTheDate3Email,
  sendSaveTheDateEmail, sendSorryPartnerEmail, sendThankYouEmail
} from './email';
import { ensureSecret } from './secret';
import { isTruthy } from './util/util';

const getFilteredGuests = async (ids: GuestId[]): Promise<Guest[]> =>
  (await guestsTable.all())
    .sort((a: Guest, b: Guest) => a.index - b.index)
    .filter((guest: Guest) => !ids.length || ids.indexOf(guest.id!) >= 0);

export async function sendTest(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  const body = await sendSaveTheDate3Email({
    names: ['Paul', 'Lam'],
    emails: ['lessing.paul+paul@gmail.com', 'lessing.paul+lam@gmail.com']
  });

  return {
    statusCode: 200,
    body: JSON.stringify(body)
  };
}

export async function sendSaveTheDate(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  ensureSecret(event);

  const ids = event.body && event.body.split('\n').map(GuestId.validate) || [];

  const guests = await getFilteredGuests(ids);

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
    emails: group.map((guest) => guest.email).filter(isTruthy),
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

  const ids = event.body && event.body.split('\n').map(GuestId.validate) || [];

  const guests = await getFilteredGuests(ids);

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
    emails: group.map((guest) => guest.email).filter(isTruthy),
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

export async function sendSaveTheDate3(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  ensureSecret(event);

  const ids = event.body && event.body.split('\n').map(GuestId.validate) || [];
  if (!ids.length) {
    return {
      statusCode: 204,
      body: 'Nothing to do, provide some IDs maybe',
      headers: {
        'Content-Type': 'text/plain'
      }
    }
  }

  const guests = await getFilteredGuests(ids);

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
    emails: group.map((guest) => guest.email).filter(isTruthy),
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
    return sendSaveTheDate3Email(email).then(() => ({
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

export async function sendRsvpReminders(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  ensureSecret(event);

  const rsvps = (await rsvpTable.all()).map(({ guestId }) => guestId);
  const guests = (await getFilteredGuests([])).filter(({ id }) => rsvps.indexOf(id) < 0);

  const groups: Guest[][] = [];
  for (const guest of guests) {
    if (!guest.groupId) {
      groups.push([guest]);
    } else {
      const group = groups.find((_group) => _group[0].groupId === guest.groupId);
      if (group) {
        group.push(guest);
      } else {
        groups.push([guest]);
      }
    }
  }

  const groupsWithoutEmails: Guest[][] = [];

  const emails: ReminderEmailData[] = groups.map((group): ReminderEmailData => ({
    id: group[0].id,
    emails: group.map((guest) => guest.email).filter(isTruthy),
    names: group.map((guest) => guest.firstName),
  })).filter((email, index) => {
    const noEmails = email.emails.length === 0;
    if (noEmails) {
      groupsWithoutEmails.push(groups[index]);
    }
    return !noEmails;
  });

  const notSentList = groupsWithoutEmails.map((group) => group.map((guest) =>
    `${guest.firstName}${guest.lastName ? ' ' + guest.lastName : ''}`
  ).join(' and ')).join('\n');

  console.log('Sending to:', emails);

  const results = await Promise.all(emails.map((email) => {
    return sendReminderEmail(email).then(() => ({
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
    statusCode: failures.length ? 500 : 200,
    body: result,
    headers: {
      'Content-Type': 'text/plain'
    }
  };
}

export async function sendOneMonthUpdate(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  ensureSecret(event);

  const rsvps = (await rsvpTable.all())
    .filter(isFullRsvp)
    .filter((rsvp) => rsvp.isAttending);

  const emails: SaveTheDateEmailData[] = rsvps.map((rsvp): SaveTheDateEmailData => ({
    emails: [rsvp.email],
    names: rsvp.guests.map((guest) => guest.firstName),
  }));

  console.log('Sending to:', JSON.stringify(emails));

  const results = await Promise.all(emails.map((email) => {
    return sendOneMonthEmail(email).then(() => ({
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
${failures.join('\n')}`;

  return {
    statusCode: failures.length ? 500 : 200,
    body: result,
    headers: {
      'Content-Type': 'text/plain'
    }
  };
}

export async function sendThankYouEmails(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  ensureSecret(event);

  const rsvps = (await rsvpTable.all())
    .filter(isFullRsvp)
    .filter((rsvp) => rsvp.isAttending);

  const emails: SaveTheDateEmailData[] = rsvps.map((rsvp): SaveTheDateEmailData => ({
    emails: [rsvp.email],
    names: rsvp.guests.map((guest) => guest.firstName),
  }));

  console.log('Sending to:', JSON.stringify(emails));

  const results = await Promise.all(emails.map((email) => {
    return sendThankYouEmail(email).then(() => ({
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
${failures.join('\n')}`;

  return {
    statusCode: failures.length ? 500 : 200,
    body: result,
    headers: {
      'Content-Type': 'text/plain'
    }
  };
}

export async function sendSorryEmail(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  ensureSecret(event);

  const emails: SaveTheDateEmailData[] = [
    {
      names: ['Resi'],
      emails: ['theres.lessing@gmail.com']
    },
    {
      names: ['Naila'],
      emails: ['naila_dhalla@hotmail.com']
    },
  ];

  console.log('Sending to:', JSON.stringify(emails));

  const results = await Promise.all(emails.map((email) => {
    return sendSorryPartnerEmail(email).then(() => ({
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

  const successes = results.filter((result) => result.success).map((success) => `${ success.names } (${ success.emails })`);
  const failures = results.filter((result) => !result.success).map((success) => `${ success.names } (${ success.emails })`);

  const result =
    `Successfully sent ${ successes.length } emails:
${ successes.join('\n') }

Failed to send ${ failures.length } emails:
${ failures.join('\n') }`;

  return {
    statusCode: failures.length ? 500 : 200,
    body: result,
    headers: {
      'Content-Type': 'text/plain'
    }
  };
}
