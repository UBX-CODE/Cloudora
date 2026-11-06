import app from './app';
import { config } from './config/env';

const server = app.listen(config.PORT, () => {
  console.log(`=========================================`);
  console.log(` Cloudora Backend Service Running       `);
  console.log(` Port: ${config.PORT}                      `);
  console.log(` Mode: ${config.NODE_ENV}               `);
  console.log(` URL:  http://localhost:${config.PORT}     `);
  console.log(`=========================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

