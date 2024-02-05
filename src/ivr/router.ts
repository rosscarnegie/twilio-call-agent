import { Router, Request, Response } from 'express';
import { welcome, menu, actions } from './handler';

const router: Router = Router();

// POST: /ivr/welcome
router.post('/welcome', (req: Request, res: Response) => {
  res.send(welcome());
});

// POST: /ivr/menu
router.post('/menu', (req: Request, res: Response) => {
  const digit: string = req.body.Digits;
  return res.send(menu(digit));
});

// POST: /ivr/actions
router.post('/actions', (req: Request, res: Response) => {
  const digit: string = req.body.Digits;
  res.send(actions(digit));
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
