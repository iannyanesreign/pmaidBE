import path from 'path';
import { readFileSync } from 'fs';

const config = {
  env: process.env.NODE_ENV || 'development',
  sslPort: 4444,
  appName: process.env.APPLICATION_NAME,
  httpOptions: {},
  mongoURL: process.env.MONGO_URL,
  httpsOptions: {
    key: process.env.HTTPS_KEY || readFileSync(
      path.join(__dirname, '..', '..', 'etc', 'ssl', 'server.key'),
    ).toString(),
    cert: process.env.HTTPS_CERT || readFileSync(
      path.join(__dirname, '..', '..', 'etc', 'ssl', 'server.crt'),
    ).toString(),
  },
  jira: {
    endpoint: process.env.JIRA_ENDPOINT,
    basicAuth: process.env.JIRA_BASIC_AUTH_TOKEN,
    product: process.env.JIRA_PRODUCT,
  },
};

export default config;
