import dotenv from 'dotenv';
import app from './app';
import config from './config';

// This is what allows us to load environment variables
// they're essentially the private, or maybe, configurable, variables
dotenv.config();

const { PORT } = process.env;

const server = app.listen(config.port, function () {
  console.log(`Express server listening on port ${PORT}`);
});

export default server;
