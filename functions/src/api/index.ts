import * as express from 'express';
import offerRouter from './offer';
import rateRouter from './rate';
import exchangeRouter from './exchange';

const expressApp = express();

expressApp.use('/offer', offerRouter);
expressApp.use('/rate', rateRouter);
expressApp.use('/exchange', exchangeRouter);

export default expressApp;
