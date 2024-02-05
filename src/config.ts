import dotenv from 'dotenv';

dotenv.config();

const { PORT } = process.env;

const config = {
  // HTTP Port to run our web application
  port: process.env.PORT || '',
};

export default config;
