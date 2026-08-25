const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, db.UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`)
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF files are accepted.'));
    cb(null, true);
  },
  limits: { fileSize: 15 * 1024 * 1024 }
});

function visibleTo(user, scheme){
  // Admins are the "central control" — they can see every scheme, not just
  // the ones they personally created.
  if (user.role === 'admin') return true;
  return scheme.memberIds.includes(user.id);
}

// Every "AI-flagged anomaly" in this scaffold is a simple, explainable
// heuristic — swap runFlagCheck() for a real model without touching
// any route or the frontend contract.
function runFlagCheck(scheme){
  const totalSpent = scheme.documents
    .filter(d => d.type === 'expenditure' && d.status === 'verified')
    .reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const ratio = scheme.initialBudget > 0 ? totalSpent / scheme.initialBudget : 0;
  if (ratio > 0.9) return 'high';
  if (ratio > 0.6) return 'medium';
  return 'low';
}

function toDetail(scheme){
  const verified = scheme.documents.filter(d => d.status === 'verified');
  return {
    ...scheme,
    progressDocs: verified.filter(d => d.type === 'progress'),
    expenditureDocs: verified.filter(d => d.type === 'expenditure'),
    pendingDocs: scheme.documents.filter(d => d.status === 'pending'),
  };
}

function toSummary(scheme){
  const { documents, memberIds, ...summary } = scheme;
  return summary;
}

// ---- Create a scheme (admin only) ----
router.post('/', requireRole('admin'), (req, res) => {
  const { name, initialBudget } = req.body || {};
  if (!name || initialBudget === undefined){
    return res.status(400).json({ message: 'Scheme name and initial budget are required.' });
  }

  const data = db.load();
  const scheme = {
    id: uuid(),
    name,
    initialBudget: Number(initialBudget),
    status: 'ongoing',
    progressPercent: 0,
    risk: 'low',
    createdBy: req.user.id,
    memberIds: [req.user.id],
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.schemes.push(scheme);
  db.save(data);
  res.status(201).json(toSummary(scheme));
});

// ---- List schemes visible to the caller ----
router.get('/', (req, res) => {
  const { status } = req.query;
  const data = db.load();
  let schemes = data.schemes.filter(s => visibleTo(req.user, s));
  if (status) schemes = schemes.filter(s => s.status === status);
  res.json(schemes.map(toSummary));
});

// ---- Scheme detail (documents split into progress / expenditure / pending) ----
router.get('/:id', (req, res) => {
  const data = db.load();
  const scheme = data.schemes.find(s => s.id === req.params.id);
  if (!scheme) return res.status(404).json({ message: 'Scheme not found.' });
  if (!visibleTo(req.user, scheme)) return res.status(403).json({ message: 'You do not have access to this scheme.' });
  res.json(toDetail(scheme));
});

// ---- Upload the scheme's supporting document (admin, at creation time) ----
router.post('/:id/document', requireRole('admin'), upload.single('file'), (req, res) => {
  const data = db.load();
  const scheme = data.schemes.find(s => s.id === req.params.id);
  if (!scheme) return res.status(404).json({ message: 'Scheme not found.' });
  if (!req.file) return res.status(400).json({ message: 'No file received.' });

  scheme.documents.push({
    id: uuid(),
    type: 'reference',
    status: 'verified',
    filename: req.file.originalname,
    storedAs: req.file.filename,
    uploadedBy: req.user.email,
    uploadedAt: new Date().toISOString()
  });
  scheme.updatedAt = new Date().toISOString();
  db.save(data);
  res.status(201).json({ ok: true });
});

// ---- End user uploads progress proof -> lands in "to be verified" ----
router.post('/:id/progress', requireRole('enduser'), upload.single('file'), (req, res) => {
  const data = db.load();
  const scheme = data.schemes.find(s => s.id === req.params.id);
  if (!scheme) return res.status(404).json({ message: 'Scheme not found.' });
  if (!scheme.memberIds.includes(req.user.id)) return res.status(403).json({ message: 'You are not on this scheme.' });
  if (!req.file) return res.status(400).json({ message: 'No file received.' });

  scheme.documents.push({
    id: uuid(),
    type: 'progress',
    status: 'pending',
    filename: req.file.originalname,
    storedAs: req.file.filename,
    percent: Number(req.body.percent || 0),
    uploadedBy: req.user.email,
    uploadedAt: new Date().toISOString()
  });
  scheme.updatedAt = new Date().toISOString();
  db.save(data);
  res.status(201).json({ ok: true });
});

// ---- End user uploads expenditure proof -> lands in "to be verified" ----
router.post('/:id/expenditure', requireRole('enduser'), upload.single('file'), (req, res) => {
  const data = db.load();
  const scheme = data.schemes.find(s => s.id === req.params.id);
  if (!scheme) return res.status(404).json({ message: 'Scheme not found.' });
  if (!scheme.memberIds.includes(req.user.id)) return res.status(403).json({ message: 'You are not on this scheme.' });
  if (!req.file) return res.status(400).json({ message: 'No file received.' });

  scheme.documents.push({
    id: uuid(),
    type: 'expenditure',
    status: 'pending',
    filename: req.file.originalname,
    storedAs: req.file.filename,
    amount: Number(req.body.amount || 0),
    uploadedBy: req.user.email,
    uploadedAt: new Date().toISOString()
  });
  scheme.updatedAt = new Date().toISOString();
  db.save(data);
  res.status(201).json({ ok: true });
});

// ---- Intermediate/admin verifies a pending document ----
router.post('/:id/verify/:docId', requireRole('admin', 'intermediate'), (req, res) => {
  const data = db.load();
  const scheme = data.schemes.find(s => s.id === req.params.id);
  if (!scheme) return res.status(404).json({ message: 'Scheme not found.' });
  if (!visibleTo(req.user, scheme)) return res.status(403).json({ message: 'You do not have access to this scheme.' });

  const doc = scheme.documents.find(d => d.id === req.params.docId);
  if (!doc) return res.status(404).json({ message: 'Document not found.' });

  doc.status = 'verified';
  doc.verifiedBy = req.user.email;
  doc.verifiedAt = new Date().toISOString();

  if (doc.type === 'progress'){
    scheme.progressPercent = Math.max(scheme.progressPercent, Number(doc.percent || 0));
    if (scheme.progressPercent >= 100) scheme.status = 'completed';
  }
  scheme.risk = runFlagCheck(scheme);
  scheme.updatedAt = new Date().toISOString();

  db.save(data);
  res.json({ ok: true });
});

module.exports = router;
