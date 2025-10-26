const mysql = require('mysql2/promise');

(async () => {
  const config = {
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'Jaheed@9',
    database: 'pos_db',
    multipleStatements: true
  };

  const columnsToAdd = [
    { name: 'created_user_id', definition: 'INT DEFAULT NULL' },
    { name: 'updated_user_id', definition: 'INT DEFAULT NULL' },
    { name: 'reserve_1', definition: "VARCHAR(128) DEFAULT NULL" },
    { name: 'reserve_2', definition: "VARCHAR(128) DEFAULT NULL" }
  ];

  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('Connected to DB, running migration...');

    for (const col of columnsToAdd) {
      const [rows] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'IT_CONF_PROPERTY' AND COLUMN_NAME = ?`,
        [config.database, col.name]
      );
      const exists = rows && rows[0] && rows[0].cnt > 0;
      if (exists) {
        console.log(`Column ${col.name} already exists, skipping`);
        continue;
      }

      const alterSql = `ALTER TABLE IT_CONF_PROPERTY ADD COLUMN ${col.name} ${col.definition}`;
      console.log(`Adding column ${col.name}...`);
      await conn.query(alterSql);
      console.log(`Added column ${col.name}`);
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
})();
