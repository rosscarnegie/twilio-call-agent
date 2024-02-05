import { twiml } from 'twilio';

const { VoiceResponse } = twiml;

const response = new VoiceResponse();

export function welcome(): string {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    action: '/ivr/menu',
    numDigits: 1,
    method: 'POST',
  });

  gather.say({ loop: 3 }, 'Welcome to the App');

  return response.toString();
}

export function menu(digit: string): string {
  const optionActions: { [key: string]: () => string } = {
    '1': requestOne,
    '2': requestTwo,
  };

  return optionActions[digit] ? optionActions[digit]() : redirectWelcome();
}

export function actions(digit: string): string {
  const optionActions: { [key: string]: string } = {
    '2': '+14707926291',
  };

  if (optionActions[digit]) {
    const twiml = new VoiceResponse();
    twiml.dial(optionActions[digit]);
    return twiml.toString();
  }

  return redirectWelcome();
}

function requestOne(): string {
  const twiml = new VoiceResponse();

  twiml.say(
    {
      voice: 'Polly.Amy',
      language: 'en-GB',
    },
    '',
  );

  twiml.say('This is my first Request');

  twiml.hangup();

  return twiml.toString();
}

function requestTwo(): string {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    action: '/ivr/actions',
    numDigits: 1,
    method: 'POST',
  });

  gather.say(
    {
      voice: 'Polly.Amy',
      language: 'en-GB',
      loop: 3,
    },
    'This is my second Request',
  );

  return twiml.toString();
}

function redirectWelcome(): string {
  const twiml = new VoiceResponse();

  twiml.say(
    {
      voice: 'Polly.Amy',
      language: 'en-GB',
    },
    'Returning to the main menu',
  );

  twiml.redirect('/ivr/welcome');

  return twiml.toString();
}
