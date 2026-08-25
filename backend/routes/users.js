const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// List users attached to a scheme (populates the sidebar "Users" panel).
router.get('/', requireRole('admin', 'intermediate'), (req, res) => {
  const { schemeId } = req.query;
  if (!schemeId) return res.status(400).json({ message: 'schemeId is required.' });

  const data = db.load();
  const users = data.users
    .filter(u => u.schemeIds.includes(schemeId))
    .map(u => ({ id: u.id, email: u.email, role: u.role }));
  res.json(users);
});

// Create a user under the caller's hierarchy tier.
// Admins add intermediates or end users. Intermediates add end users only —
// that's what keeps the tree shaped admin -> intermediate -> end user.
router.post('/', requireRole('admin', 'intermediate'), (req, res) => {
  const { email, password, role, schemeId } = req.body || {};
  if (!email || !password || !role || !schemeId){
    return res.status(400).json({ message: 'Email, password, role and schemeId are all required.' });
  }

  const allowedRoles = req.user.role === 'admin' ? ['intermediate', 'enduser'] : ['enduser'];
  if (!allowedRoles.includes(role)){
    return res.status(403).json({ message: `A ${req.user.role} can only add: ${allowedRoles.join(', ')}.` });
  }

  const data = db.load();

  const scheme = data.schemes.find(s => s.id === schemeId);
  if (!scheme) return res.status(404).json({ message: 'Scheme not found.' });

  if (req.user.role === 'intermediate' && !scheme.memberIds.includes(req.user.id)){
    return res.status(403).json({ message: 'You are not a member of this scheme.' });
  }

  if (data.users.some(u => u.email.toLowerCase() === email.toLowerCase())){
    return res.status(409).json({ message: 'A user with that email already exists.' });
  }

  const newUser = {
    id: uuid(),
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    schemeIds: [schemeId],
    createdAt: new Date().toISOString()
  };
  data.users.push(newUser);

  if (!scheme.memberIds.includes(newUser.id)) scheme.memberIds.push(newUser.id);
  db.save(data);

  res.status(201).json({ id: newUser.id, email: newUser.email, role: newUser.role });
});

module.exports = router;
