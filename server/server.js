import { webcrypto } from 'crypto';

// Node < 19 doesn't expose the WebCrypto API as a global, which mongoose 9's
// MongoDB driver relies on. Polyfill it so the app runs on older Node LTS versions.
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

import app from './src/app.js';
import connectDB from './src/config/database.js';
import envConfig from './src/config/envConfig.js';

connectDB();

const server = app.listen(envConfig.port, () => {
  console.log(`Server running in ${envConfig.nodeEnv} mode on port ${envConfig.port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
