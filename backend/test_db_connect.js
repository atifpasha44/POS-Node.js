const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'Jaheed@9',
  database: 'pos_db'
});

db.connect((err) => {
  if (err) {
    console.error('TEST: DB connect failed', err.message);
    process.exit(1);
  }
  console.log('TEST: DB connect successful');
  db.end();
});
