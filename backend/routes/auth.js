const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password){
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const data = db.load();
  const user = data.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)){
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role }
  });
});

router.get('/me', require('../middleware/auth').authRequired, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
