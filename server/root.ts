import * as guests from './guests.handler';
import { createRequestHandler } from './util/http-helpers';
import * as views from './views.handler';
import * as email from './email.handler';

const guestsPutAll = createRequestHandler(guests.putAll);
const logView = createRequestHandler(views.logView);
const sendTestEmail = createRequestHandler(email.sendTest);
const sendSaveTheDate = createRequestHandler(email.sendSaveTheDate);
const sendSaveTheDate2 = createRequestHandler(email.sendSaveTheDate2);

export {
  guestsPutAll,
  logView,
  sendTestEmail,
  sendSaveTheDate,
  sendSaveTheDate2,
};
