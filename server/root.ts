import * as email from './email.handler';
import * as guests from './guests.handler';
import * as rsvp from './rsvp.handler';
import { serveStatic } from './static.handler';
import { createRequestHandler } from './util/http-helpers';
import * as views from './views.handler';

const guestsPutAll = createRequestHandler(guests.putAll);
const guestsPutSingle = createRequestHandler(guests.updateGuest);
const searchGuestByName = createRequestHandler(guests.searchGuestByName);
const getGuestById = createRequestHandler(guests.getById);
const getResponseData = createRequestHandler(guests.getResponseData);
const putRsvp = createRequestHandler(rsvp.putRsvp);
const getAllResponses = createRequestHandler(rsvp.getAllResponses);

const logView = createRequestHandler(views.logView);
const sendTestEmail = createRequestHandler(email.sendTest);
const sendSaveTheDate = createRequestHandler(email.sendSaveTheDate);
const sendSaveTheDate2 = createRequestHandler(email.sendSaveTheDate2);
const sendSaveTheDate3 = createRequestHandler(email.sendSaveTheDate3);
const sendRsvpReminders = createRequestHandler(email.sendRsvpReminders);
const sendOneMonthUpdate = createRequestHandler(email.sendOneMonthUpdate);

export {
  guestsPutAll,
  guestsPutSingle,
  searchGuestByName,
  getGuestById,
  getResponseData,
  putRsvp,
  getAllResponses,
  logView,
  sendTestEmail,
  sendSaveTheDate,
  sendSaveTheDate2,
  sendSaveTheDate3,
  sendRsvpReminders,
  sendOneMonthUpdate,
  serveStatic,
};
