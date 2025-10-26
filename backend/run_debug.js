process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err && err.stack ? err.stack : err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, p) => {
  console.error('UNHANDLED REJECTION at:', p, 'reason:', reason && reason.stack ? reason.stack : reason);
  process.exit(1);
});

console.log('Starting backend via wrapper...');
require('./index.js');
