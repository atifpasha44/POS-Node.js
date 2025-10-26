const mysql = require('mysql2');
let config = {};
try {
  config = require('./db_config') || {};
} catch (e) {
  // fallback to explicit local config used elsewhere in the repo
  config = { host: 'localhost', port: 3307, user: 'root', password: 'Jaheed@9', database: 'pos_db' };
}

const connection = mysql.createConnection({
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database,
  port: config.port
});

const columnsToAdd = [
  {
    name: 'display_sequence',
    definition: 'INT DEFAULT NULL'
  }
];

connection.connect(err => {
  if (err) {
    console.error('DB connection error:', err);
    process.exit(1);
  }
  console.log('Connected to DB for reason codes migration');

  columnsToAdd.reduce((p, col) => {
    return p.then(() => {
      return new Promise((resolve, reject) => {
        const checkSql = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'IT_CONF_REASONS' AND COLUMN_NAME = ?`;
        connection.query(checkSql, [connection.config.database, col.name], (err, rows) => {
          if (err) return reject(err);
          if (rows && rows.length > 0) {
            console.log(`Column ${col.name} already exists`);
            return resolve();
          }

          const alterSql = `ALTER TABLE IT_CONF_REASONS ADD COLUMN ${col.name} ${col.definition}`;
          connection.query(alterSql, (err2) => {
            if (err2) return reject(err2);
            console.log(`Added column ${col.name}`);
            resolve();
          });
        });
      });
    });
  }, Promise.resolve()).then(() => {
    console.log('Migration completed');
    connection.end();
  }).catch(err => {
    console.error('Migration error:', err);
    connection.end();
    process.exit(1);
  });
});
