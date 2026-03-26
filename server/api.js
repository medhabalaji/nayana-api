require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Dirs ───────────────────────────────────────────────────────
const DATA_DIR   = path.join(__dirname, '../data');
const DOCS_DIR   = path.join(__dirname, '../doctor_docs');
const IMGS_DIR   = path.join(__dirname, '../received_images');
const PUBLIC_DIR = path.join(__dirname, '../frontend/public');

[DATA_DIR, DOCS_DIR, IMGS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

// ── Middleware ─────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(PUBLIC_DIR));
app.use('/doctor_docs',      express.static(DOCS_DIR));
app.use('/received_images',  express.static(IMGS_DIR));

// ── JSON helpers ───────────────────────────────────────────────
const loadJSON = (file) => {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return []; }
};
const saveJSON = (file, data) =>
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));

// ── Multer: certificate upload ─────────────────────────────────
const certStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, DOCS_DIR),
  filename:    (_, file, cb) =>
    cb(null, `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`)
});
const certUpload = multer({
  storage: certStorage,
  limits:  { fileSize: 10 * 1024 * 1024 },         // 10 MB
  fileFilter: (_, file, cb) => {
    const ok = /pdf|jpg|jpeg|png/i.test(
      path.extname(file.originalname).slice(1)
    );
    cb(ok ? null : new Error('Only PDF/JPG/PNG allowed'), ok);
  }
});

// ── Multer: eye image upload ───────────────────────────────────
const imgStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, IMGS_DIR),
  filename:    (_, file, cb) =>
    cb(null, `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`)
});
const imgUpload = multer({ storage: imgStorage, limits: { fileSize: 50 * 1024 * 1024 } });

// ══════════════════════════════════════════════════════════════
// AUTH — PATIENT
// ══════════════════════════════════════════════════════════════
app.post('/api/auth/patient/register', (req, res) => {
  const { name, age, gender, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, error: 'Missing required fields' });

  const patients = loadJSON('patients.json');
  if (patients.some(p => p.email === email))
    return res.status(400).json({ success: false, error: 'Email already registered' });

  patients.push({ id: `PAT-${Date.now()}`, name, age, gender, email, password, createdAt: new Date().toISOString() });
  saveJSON('patients.json', patients);
  res.json({ success: true });
});

app.post('/api/auth/patient/login', (req, res) => {
  const { email, password } = req.body;
  const patient = loadJSON('patients.json').find(p => p.email === email && p.password === password);
  if (!patient)
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  const { password: _, ...safe } = patient;
  res.json({ success: true, user: { ...safe, role: 'patient' } });
});

// ══════════════════════════════════════════════════════════════
// AUTH — DOCTOR
// ══════════════════════════════════════════════════════════════
app.post('/api/auth/doctor/register', certUpload.single('certificate'), (req, res) => {
  const { name, specialization, hospital, licenseNo, email, password } = req.body;
  if (!name || !email || !password || !licenseNo)
    return res.status(400).json({ success: false, error: 'Missing required fields' });

  const doctors = loadJSON('doctors.json');
  if (doctors.some(d => d.email === email))
    return res.status(400).json({ success: false, error: 'Email already registered' });

  doctors.push({
    id:                 `DOC-${Date.now()}`,
    name, specialization, hospital, licenseNo, email, password,
    verificationStatus: 'pending',
    certFilename:       req.file ? req.file.filename : null,
    createdAt:          new Date().toISOString()
  });
  saveJSON('doctors.json', doctors);
  res.json({ success: true, message: 'Registration submitted. Awaiting admin approval.' });
});

app.post('/api/auth/doctor/login', (req, res) => {
  const { email, password } = req.body;
  const doctor = loadJSON('doctors.json').find(d => d.email === email && d.password === password);
  if (!doctor)
    return res.status(401).json({ success: false, error: 'Invalid credentials' });

  if (doctor.verificationStatus === 'pending')
    return res.status(403).json({ success: false, error: 'Access Denied: Pending Verification.' });
  if (doctor.verificationStatus === 'rejected')
    return res.status(403).json({ success: false, error: 'Your registration was rejected. Contact support.' });

  const { password: _, ...safe } = doctor;
  res.json({ success: true, user: { ...safe, role: 'doctor' } });
});

// ══════════════════════════════════════════════════════════════
// AUTH — ADMIN  (admin / admin123)
// ══════════════════════════════════════════════════════════════
app.post('/api/auth/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123')
    return res.json({ success: true, user: { id: 'ADMIN-1', name: 'Admin', role: 'admin' } });
  res.status(401).json({ success: false, error: 'Invalid admin credentials' });
});

// ══════════════════════════════════════════════════════════════
// ADMIN — DOCTOR MANAGEMENT
// ══════════════════════════════════════════════════════════════
app.get('/api/admin/doctors', (_, res) => {
  res.json({ success: true, doctors: loadJSON('doctors.json') });
});

app.post('/api/admin/doctors/:email/approve', (req, res) => {
  const doctors = loadJSON('doctors.json');
  const idx = doctors.findIndex(d => d.email === req.params.email);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Doctor not found' });
  doctors[idx].verificationStatus = 'approved';
  saveJSON('doctors.json', doctors);
  res.json({ success: true });
});

app.post('/api/admin/doctors/:email/reject', (req, res) => {
  const doctors = loadJSON('doctors.json');
  const idx = doctors.findIndex(d => d.email === req.params.email);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Doctor not found' });
  doctors[idx].verificationStatus = 'rejected';
  saveJSON('doctors.json', doctors);
  res.json({ success: true });
});

// View uploaded certificate
app.get('/api/admin/doctors/:email/certificate', (req, res) => {
  const doctors = loadJSON('doctors.json');
  const doctor  = doctors.find(d => d.email === req.params.email);
  if (!doctor || !doctor.certFilename)
    return res.status(404).json({ success: false, error: 'No certificate on file' });
  res.sendFile(path.join(DOCS_DIR, doctor.certFilename));
});

// ══════════════════════════════════════════════════════════════
// SHARED — APPROVED DOCTORS LIST (for patient send-report)
// ══════════════════════════════════════════════════════════════
app.get('/api/doctors', (_, res) => {
  const approved = loadJSON('doctors.json')
    .filter(d => d.verificationStatus === 'approved')
    .map(({ password: _, ...d }) => d);
  res.json({ success: true, doctors: approved });
});

// ══════════════════════════════════════════════════════════════
// IMAGE UPLOAD
// ══════════════════════════════════════════════════════════════
app.post('/api/upload/eye', imgUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No image provided' });
  res.json({ success: true, filename: req.file.filename, url: `/received_images/${req.file.filename}` });
});

// ══════════════════════════════════════════════════════════════
// CASES
// ══════════════════════════════════════════════════════════════
app.post('/api/cases', (req, res) => {
  const cases   = loadJSON('cases.json');
  const newCase = {
    caseId:     `CASE-${Date.now()}`,
    status:     'Pending',
    createdAt:  new Date().toISOString(),
    ...req.body
  };
  cases.push(newCase);
  saveJSON('cases.json', cases);
  res.json({ success: true, caseId: newCase.caseId });
});

app.get('/api/cases/patient/:email', (req, res) => {
  const cases = loadJSON('cases.json').filter(c => c.patientEmail === req.params.email);
  res.json({ success: true, cases });
});

app.get('/api/cases/doctor/:email', (req, res) => {
  const cases = loadJSON('cases.json').filter(c => c.sentToDoctor === req.params.email);
  res.json({ success: true, cases });
});

app.put('/api/cases/:caseId/review', (req, res) => {
  const cases = loadJSON('cases.json');
  const idx   = cases.findIndex(c => c.caseId === req.params.caseId);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Case not found' });
  Object.assign(cases[idx], { ...req.body, status: 'Reviewed', reviewedAt: new Date().toISOString() });
  saveJSON('cases.json', cases);
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════
// CATCH-ALL → serve index.html
// ══════════════════════════════════════════════════════════════
app.get('*', (_, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

app.listen(PORT, () => {
  console.log(`\n✅  Nayana API  →  http://localhost:${PORT}\n`);
  console.log('Routes:  /api/auth/*  /api/admin/*  /api/doctors  /api/cases/*  /api/upload/*\n');
});

module.exports = app;
