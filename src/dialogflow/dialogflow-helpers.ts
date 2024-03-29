import { EventEmitter } from 'events';
import { Transform, PassThrough, pipeline } from 'stream';
import * as uuid from 'uuid';
import * as dialogflow from 'dialogflow';
import * as structjson from 'structjson';
import { WaveFile } from 'wavefile';
import dotenv from 'dotenv';
dotenv.config();

// https://github.com/twilio/media-streams/tree/master
// https://www.youtube.com/watch?v=aUn9i9jJYvE

const projectId: string = process.env.DIALOGFLOW_PROJECT_ID || '';

const intentQueryAudioInput: any = {
  audioConfig: {
    audioEncoding: 'AUDIO_ENCODING_MULAW',
    sampleRateHertz: 8000,
    languageCode: 'en-US',
    singleUtterance: true,
  },
  interimResults: false,
};

function createDetectStream(
  isFirst: boolean,
  sessionId: string,
  sessionPath: string,
  sessionClient: any,
): any {
  let queryInput: any = intentQueryAudioInput;
  if (isFirst) {
    queryInput = {
      event: {
        name: process.env.DIALOGFLOW_STARTING_EVENT_NAME,
        languageCode: 'en-US',
      },
    };
  }
  const initialStreamRequest: any = {
    queryInput,
    session: sessionPath,
    queryParams: {
      session: sessionClient.sessionPath(projectId, sessionId),
    },
    outputAudioConfig: {
      audioEncoding: 'OUTPUT_AUDIO_ENCODING_LINEAR_16',
    },
  };

  const detectStream: any = sessionClient.streamingDetectIntent();
  detectStream.write(initialStreamRequest);
  return detectStream;
}

function createAudioResponseStream(): any {
  return new Transform({
    objectMode: true,
    transform: (chunk, encoding, callback) => {
      if (!chunk.outputAudio || chunk.outputAudio.length == 0) {
        return callback();
      }
      // Convert the LINEAR 16 Wavefile to 8000/mulaw
      const wav = new WaveFile();
      wav.fromBuffer(chunk.outputAudio);
      wav.toSampleRate(8000);
      wav.toMuLaw();
      return callback(null, Buffer.from(wav.data.samples));
    },
  });
}

function createAudioRequestStream(): any {
  return new Transform({
    objectMode: true,
    transform: (chunk, encoding, callback) => {
      const msg = JSON.parse(chunk.toString('utf8'));
      // Only process media messages
      if (msg.event !== 'media') return callback();
      // This is mulaw/8000 base64-encoded
      return callback(null, { inputAudio: msg.media.payload });
    },
  });
}

export class DialogflowService extends EventEmitter {
  private sessionId: string;
  private sessionClient: any;
  private sessionPath: string;
  private isFirst: boolean;
  private isReady: boolean;
  private isStopped: boolean;
  private isInterrupted: boolean;
  private _requestStream: any;
  private finalQueryResult: any;

  constructor() {
    super();
    this.sessionId = uuid.v4();
    // Instantiates a session client
    this.sessionClient = new dialogflow.SessionsClient();
    this.sessionPath = this.sessionClient.sessionPath(
      projectId,
      this.sessionId,
    );
    // State management
    this.isFirst = true;
    this.isReady = false;
    this.isStopped = false;
    this.isInterrupted = false;
  }

  send(message: any): void {
    const stream = this.startPipeline();
    stream.write(message);
  }

  getFinalQueryResult(): any {
    if (this.finalQueryResult) {
      const queryResult = {
        intent: {
          name: this.finalQueryResult.intent.name,
          displayName: this.finalQueryResult.intent.displayName,
        },
        parameters: structjson.structProtoToJson(
          this.finalQueryResult.parameters,
        ),
      };
      return queryResult;
    }
  }

  startPipeline(): any {
    if (!this.isReady) {
      // Generate the streams
      this._requestStream = new PassThrough({ objectMode: true });
      const audioStream = createAudioRequestStream();
      const detectStream = createDetectStream(
        this.isFirst,
        this.sessionId,
        this.sessionPath,
        this.sessionClient,
      );
      const responseStream = new PassThrough({ objectMode: true });
      const audioResponseStream = createAudioResponseStream();
      if (this.isFirst) this.isFirst = false;
      this.isInterrupted = false;
      // Pipeline is async....
      pipeline(
        this._requestStream,
        audioStream,
        detectStream,
        responseStream,
        audioResponseStream,
        (err) => {
          if (err) {
            this.emit('error', err);
          }
          // Update the state so as to create a new pipeline
          this.isReady = false;
        },
      );

      this._requestStream.on('data', (data) => {
        const msg = JSON.parse(data.toString('utf8'));
        if (msg.event === 'start') {
          console.log(`Captured call ${msg.start.callSid}`);
          this.emit('callStarted', {
            callSid: msg.start.callSid,
            streamSid: msg.start.streamSid,
          });
        }
        if (msg.event === 'mark') {
          console.log(`Mark received ${msg.mark.name}`);
          if (msg.mark.name === 'endOfInteraction') {
            this.emit('endOfInteraction', this.getFinalQueryResult());
          }
        }
      });

      responseStream.on('data', (data) => {
        if (
          data.recognitionResult &&
          data.recognitionResult.transcript &&
          data.recognitionResult.transcript.length > 0
        ) {
          this.emit('interrupted', data.recognitionResult.transcript);
        }
        if (
          data.queryResult &&
          data.queryResult.intent &&
          data.queryResult.intent.endInteraction
        ) {
          console.log(
            `Ending interaction with: ${data.queryResult.fulfillmentText}`,
          );
          this.finalQueryResult = data.queryResult;
          this.stop();
        }
      });

      audioResponseStream.on('data', (data) => {
        this.emit('audio', data.toString('base64'));
      });
      // Set ready
      this.isReady = true;
    }
    return this._requestStream;
  }

  stop() {
    console.log('Stopping Dialogflow');
    this.isStopped = true;
  }

  finish() {
    console.log('Disconnecting from Dialogflow');
    this._requestStream.end();
  }
}
