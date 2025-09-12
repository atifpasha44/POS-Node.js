// ...existing code...
// (Move all route definitions below app initialization)
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: 'pos_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Aq9885346751.$',
  database: 'ithoughts'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL');
});


function injectTablesIfNeeded(callback) {
  const createUserTableSQL = `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    tin VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    profile_img VARCHAR(255),
    role VARCHAR(32) DEFAULT 'user'
  )`;
  const createGroupTableSQL = `CREATE TABLE IF NOT EXISTS user_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE
  )`;
  db.query(createUserTableSQL, (err) => {
    if (err) return callback(err);
    db.query(createGroupTableSQL, (err) => {
      if (err) return callback(err);
      // Check if admin user exists
      db.query('SELECT * FROM users WHERE email = ?', ['admin@pos.com'], (err, results) => {
        if (err) return callback(err);
        if (results.length === 0) {
          db.query(
            'INSERT INTO users (email, password, tin, name, profile_img, role) VALUES (?, ?, ?, ?, ?, ?)',
            ['admin@pos.com', 'admin123', '123456789', 'Admin User', 'profile.png', 'admin'],
            callback
          );
        } else {
          callback();
        }
      });
    });
  });
}
// Admin-only: Create user group
app.post('/api/groups', (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser || (sessionUser.role !== 'admin' && !sessionUser.isAdmin)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Missing group name' });
  }
  db.query(
    'INSERT INTO user_groups (name) VALUES (?)',
    [name],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ success: false, message: 'Group already exists' });
        }
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      res.json({ success: true, groupId: result.insertId });
    }
  );
});



app.post('/api/login', (req, res) => {
  injectTablesIfNeeded((err) => {
    if (err) return res.status(500).json({ error: 'DB setup error' });
    const { email, password, tin } = req.body;
    if (email && password) {
      db.query(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        [email, password],
        (err, results) => {
          if (err) return res.status(500).json({ error: 'DB error' });
          if (results.length > 0) {
            req.session.user = results[0];
            res.json({ success: true, user: results[0] });
          } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
          }
        }
      );
    } else if (tin) {
      db.query(
        'SELECT * FROM users WHERE tin = ?',
        [tin],
        (err, results) => {
          if (err) return res.status(500).json({ error: 'DB error' });
          if (results.length > 0) {
            req.session.user = results[0];
            res.json({ success: true, user: results[0] });
          } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
          }
        }
      );
    } else {
      res.status(400).json({ success: false, message: 'Missing credentials' });
    }
  });
});

// Admin-only: Add new user
app.post('/api/users', (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser || (sessionUser.role !== 'admin' && !sessionUser.isAdmin)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const { email, password, tin, name, profile_img, role } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  db.query(
    'INSERT INTO users (email, password, tin, name, profile_img, role) VALUES (?, ?, ?, ?, ?, ?)',
    [email, password, tin || '', name, profile_img || '', role],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ success: false, message: 'User already exists' });
        }
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      res.json({ success: true, userId: result.insertId });
    }
  );
});

app.get('/api/profile', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

app.listen(5000, () => {
  console.log('Backend running on port 5000');
});
