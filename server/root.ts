import * as guests from './guests.handler';
import { createRequestHandler } from './util/http-helpers';

const guestsPutAll = createRequestHandler(guests.putAll);

export {
  guestsPutAll
};
