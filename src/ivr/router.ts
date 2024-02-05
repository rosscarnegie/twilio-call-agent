import { Router, Request, Response } from 'express';
import { greeting, connectToAgent } from './handler';

const router: Router = Router();

// POST: /ivr/welcome
router.post('/welcome', (req: Request, res: Response) => {
  res.send(greeting());
});

router.post('/dialogflow', (req: Request, res: Response) => {
  res.send(connectToAgent());
});

router.post('/followup', (req: Request, res: Response) => {
  res.send(connectToAgent());
});

// POST: /ivr/planets
/* router.post('/results', (req: Request, res: Response) => {
  const userInput: string = req.body.SpeechResult;
  const confidence: number = req.body.Confidence;
  const twiml = new VoiceResponse();

  console.log(userInput, confidence, twiml);
  res.send(actions(digit));
}); */

export = router;
