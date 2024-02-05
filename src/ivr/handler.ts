import { twiml } from 'twilio';

const { VoiceResponse } = twiml;

//
export function greeting(): string {
  const twiml = new VoiceResponse();
  twiml.say('Thank you for calling. How can we help you today?');

  const gather = twiml.gather({
    input: ['dtmf'],
    action: '/ivr/dialogflow',
    method: 'POST',
    speechModel: 'experimental_conversations',
    language: 'en-US',
  });

  gather.say(
    {
      loop: 1,
      language: 'en-US',
      voice: 'Polly.Amy',
    },
    'Welcome to the App',
  );

  return twiml.toString();
}

export function connectToDialogflow(): string {
  const twiml = new VoiceResponse();
  const connect = twiml.connect({
    action: 'ivr/dialogflow',
  });
  connect.virtualAgent({
    connectorName: 'nutracap',
    statusCallback: 'ivr/followup',
  });

  console.log(twiml.toString());

  return twiml.toString();
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
      language: 'en-US',
    },
    'Returning to the main menu',
  );

  twiml.redirect('/ivr/welcome');

  return twiml.toString();
}
