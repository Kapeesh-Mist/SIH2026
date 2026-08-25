require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

const db = require('./db');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use('/uploads', express.static(db.UPLOADS_DIR));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/schemes', require('./routes/schemes'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Something went wrong on the server.' });
});

// Seed the very first admin account the first time the server runs against
// an empty database, so there's always a valid email/password to log in
// with before any "Add user" has happened.
function seedAdmin(){
  const data = db.load();
  if (data.users.length > 0) return;

  const email = process.env.ADMIN_EMAIL || 'admin@fintrack.local';
  const password = process.env.ADMIN_PASSWORD || 'change-me-now';

  data.users.push({
    id: uuid(),
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'admin',
    schemeIds: [],
    createdAt: new Date().toISOString()
  });
  db.save(data);
  console.log(`Seeded first admin account: ${email} (password from ADMIN_PASSWORD in .env)`);
}

seedAdmin();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`FinTrack backend running on http://localhost:${PORT}`));
