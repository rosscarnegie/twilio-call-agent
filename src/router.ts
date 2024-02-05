import * as twilio from 'twilio';
import { Router, Request, Response } from 'express';
import ivrRouter from './ivr/router';

const router: Router = Router();

// GET: / - home page
router.get('/', (req: Request, res: Response) => {
  res.render('index');
});

router.use('/ivr', twilio.webhook({ validate: false }), ivrRouter);

export = router;
