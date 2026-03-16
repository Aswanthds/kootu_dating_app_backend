const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`
  🚀 Server is running!
  🔉 Listening on port: ${PORT}
  🔗 URL: http://localhost:${PORT}
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
