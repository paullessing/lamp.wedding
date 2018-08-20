import * as guests from './guests.handler';
import { createRequestHandler } from './util/http-helpers';
import * as views from './views.handler';

const guestsPutAll = createRequestHandler(guests.putAll);
const logView = createRequestHandler(views.logView);

export {
  guestsPutAll,
  logView,
};
