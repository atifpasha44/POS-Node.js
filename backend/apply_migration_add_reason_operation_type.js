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
    console.error('DB connect failed:', err);
    process.exit(1);
  }

  console.log('Connected to DB for reason operation_type migration');

  const checkQuery = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'pos_db' AND TABLE_NAME = 'IT_CONF_REASONS' AND COLUMN_NAME = 'OPERATION_TYPE'`;
  db.query(checkQuery, (err, rows) => {
    if (err) {
      console.error('Error checking columns:', err);
      db.end();
      process.exit(1);
    }

    if (rows && rows.length > 0) {
      console.log('Column OPERATION_TYPE already exists, skipping migration');
      db.end();
      return;
    }

    const alter = `ALTER TABLE IT_CONF_REASONS ADD COLUMN OPERATION_TYPE VARCHAR(50) DEFAULT 'General'`;
    db.query(alter, (err2) => {
      if (err2) {
        console.error('Error adding OPERATION_TYPE column:', err2);
        db.end();
        process.exit(1);
      }
      console.log('Added column OPERATION_TYPE to IT_CONF_REASONS');
      db.end();
    });
  });
});
