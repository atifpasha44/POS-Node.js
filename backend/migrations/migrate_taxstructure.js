#!/usr/bin/env node
/*
  migrate_taxstructure.js

  Usage:
    node migrate_taxstructure.js --host localhost --port 3307 --user root --password secret --database pos_db [--apply]

  By default the script will:
  - create a backup table IT_CONF_TAXSTRUCTURE_bak_{ts}
  - create IT_CONF_TAXSTRUCTURE_new and IT_CONF_TAXSTRUCTURE_TAX_new
  - copy data from IT_CONF_TAXSTRUCTURE -> IT_CONF_TAXSTRUCTURE_new
  - report counts and instructions

  If you pass --apply the script will perform the RENAME to swap the tables.

  IMPORTANT: Run in a staging environment first. Stop the application before running with --apply.
*/

const mysql = require('mysql2/promise');

function parseArgs() {
  const args = {};
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const next = raw[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

async function main() {
  const opts = parseArgs();

  const host = opts.host || process.env.MYSQL_HOST || 'localhost';
  const port = parseInt(opts.port || process.env.MYSQL_PORT || '3306', 10);
  const user = opts.user || process.env.MYSQL_USER || 'root';
  const password = opts.password || process.env.MYSQL_PASSWORD || process.env.MYSQL_PASS || '';
  const database = opts.database || process.env.MYSQL_DB || 'pos_db';
  const apply = !!opts.apply;

  console.log('Migration starting (dry run unless --apply passed)');
  console.log(`Connecting to ${user}@${host}:${port}/${database}`);

  const conn = await mysql.createConnection({ host, port, user, password, database, multipleStatements: true });

  try {
    // check base table exists
    const [rows] = await conn.query("SHOW TABLES LIKE 'IT_CONF_TAXSTRUCTURE'");
    if (!rows || rows.length === 0) {
      console.error('ERROR: IT_CONF_TAXSTRUCTURE table not found in database. Aborting.');
      process.exit(1);
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
    const backupName = `IT_CONF_TAXSTRUCTURE_bak_${ts}`;

    console.log(`Creating backup table ${backupName} ...`);
    await conn.query(`DROP TABLE IF EXISTS \`${backupName}\``);
    await conn.query(`CREATE TABLE \`${backupName}\` AS SELECT * FROM IT_CONF_TAXSTRUCTURE`);
    console.log('Backup created.');

    console.log('Creating modern table IT_CONF_TAXSTRUCTURE_new ...');
    await conn.query(`DROP TABLE IF EXISTS IT_CONF_TAXSTRUCTURE_new`);
    await conn.query(`
      CREATE TABLE IT_CONF_TAXSTRUCTURE_new (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        tax_structure_code VARCHAR(100) NULL,
        tax_structure_name VARCHAR(255) NULL,
        description TEXT NULL,
        tax_code VARCHAR(100) NULL,
        calculation_type VARCHAR(50) NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Created IT_CONF_TAXSTRUCTURE_new');

    console.log('Creating child table IT_CONF_TAXSTRUCTURE_TAX_new ...');
    await conn.query(`DROP TABLE IF EXISTS IT_CONF_TAXSTRUCTURE_TAX_new`);
    await conn.query(`
      CREATE TABLE IT_CONF_TAXSTRUCTURE_TAX_new (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        tax_structure_id INT NOT NULL,
        tax_code VARCHAR(100) NULL,
        sequence INT DEFAULT 1,
        calculation_method VARCHAR(50) NULL
      )
    `);
    console.log('Created IT_CONF_TAXSTRUCTURE_TAX_new');

    console.log('Copying rows from legacy -> new table ...');
    await conn.query(`
      INSERT INTO IT_CONF_TAXSTRUCTURE_new (tax_structure_code, tax_structure_name, description, is_active)
      SELECT CAST(TAXSTRCODE AS CHAR), TAXSTRNAME, DESCRIPTION, CASE WHEN ActiveStatus IN ('1','Y','y',1) THEN 1 ELSE 0 END
      FROM IT_CONF_TAXSTRUCTURE
    `);
    console.log('Copy complete.');

    const [[origCount]] = await conn.query('SELECT COUNT(*) AS c FROM IT_CONF_TAXSTRUCTURE');
    const [[newCount]] = await conn.query('SELECT COUNT(*) AS c FROM IT_CONF_TAXSTRUCTURE_new');

    console.log(`Original count: ${origCount.c}`);
    console.log(`New table count: ${newCount.c}`);

    if (origCount.c !== newCount.c) {
      console.warn('Row count mismatch between original and new table. Please investigate before swapping.');
    } else {
      console.log('Row counts match.');
    }

    console.log('\nIMPORTANT: The script did NOT rename/swap tables unless you passed --apply.');
    console.log('To perform atomic swap, stop the backend then re-run with --apply.');

    if (apply) {
      console.log('Performing rename/swap now (IT_CONF_TAXSTRUCTURE -> backup name, IT_CONF_TAXSTRUCTURE_new -> IT_CONF_TAXSTRUCTURE) ...');
      // Build rename statement
      const renameOld = `IT_CONF_TAXSTRUCTURE_old_${ts}`;
      const renameSql = `RENAME TABLE IT_CONF_TAXSTRUCTURE TO \`${renameOld}\`, IT_CONF_TAXSTRUCTURE_new TO IT_CONF_TAXSTRUCTURE`;
      await conn.query(renameSql);
      // rename child table
      await conn.query('RENAME TABLE IT_CONF_TAXSTRUCTURE_TAX_new TO IT_CONF_TAXSTRUCTURE_TAX');
      console.log('Rename/swap complete.');
    }

    console.log('\nPost-migration checks:');
    console.log('- Start the backend and verify GET /api/tax-structure returns modern shape.');
    console.log('- Verify UI workflows that create/edit/delete tax structures.');
    console.log('- When stable, consider dropping backup tables if you no longer need them.');

  } catch (err) {
    console.error('Migration error:', err.message || err);
    process.exitCode = 2;
  } finally {
    try { await conn.end(); } catch (e) {}
  }
}

if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
}
