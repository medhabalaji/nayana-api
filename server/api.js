require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000;

// ════════════════════════════════════════════════════════════════
// MIDDLEWARE SETUP
// ════════════════════════════════════════════════════════════════
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'frontend/public')));

// ════════════════════════════════════════════════════════════════
// DATA PERSISTENCE HELPERS
// ════════════════════════════════════════════════════════════════
const DATA_DIR = path.join(__dirname, 'data');
const DOCS_DIR = path.join(__dirname, 'docs');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

// JSON File helpers
const loadJSON = (filename) => {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
};

const saveJSON = (filename, data) => {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// ════════════════════════════════════════════════════════════════
// MULTER SETUP FOR IMAGE UPLOADS
// ════════════════════════════════════════════════════════════════
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'received_images');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// ════════════════════════════════════════════════════════════════
// AUTHENTICATION ENDPOINTS
// ════════════════════════════════════════════════════════════════

// PATIENT REGISTER
app.post('/api/auth/patient/register', (req, res) => {
  const { name, age, gender, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const patients = loadJSON('patients.json');
  
  if (patients.some(p => p.email === email)) {
    return res.status(400).json({ success: false, error: 'Email already registered' });
  }

  const newPatient = {
    id: `PAT-${Date.now()}`,
    name,
    age,
    gender,
    email,
    password, // NOTE: In production, hash this!
    createdAt: new Date().toISOString()
  };

  patients.push(newPatient);
  saveJSON('patients.json', patients);

  res.json({
    success: true,
    message: 'Patient registered successfully'
  });
});

// PATIENT LOGIN
app.post('/api/auth/patient/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  const patients = loadJSON('patients.json');
  const patient = patients.find(p => p.email === email && p.password === password);

  if (!patient) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  res.json({
    success: true,
    user: {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      age: patient.age,
      gender: patient.gender,
      role: 'patient'
    }
  });
});

// DOCTOR REGISTER
app.post('/api/auth/doctor/register', (req, res) => {
  const { name, specialization, hospital, licenseNo, email, password } = req.body;
  
  if (!name || !email || !password || !licenseNo) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const doctors = loadJSON('doctors.json');
  
  if (doctors.some(d => d.email === email)) {
    return res.status(400).json({ success: false, error: 'Email already registered' });
  }

  const newDoctor = {
    id: `DOC-${Date.now()}`,
    name,
    specialization,
    hospital,
    licenseNo,
    email,
    password, // NOTE: Hash in production!
    approved: false,
    createdAt: new Date().toISOString(),
    docPath: req.file ? req.file.path : null
  };

  // Handle document upload
  if (req.file) {
    const docFilename = `${email}_${Date.now()}_${req.file.originalname}`;
    const docPath = path.join(DOCS_DIR, docFilename);
    fs.copyFileSync(req.file.path, docPath);
    newDoctor.docPath = docPath;
  }

  doctors.push(newDoctor);
  saveJSON('doctors.json', doctors);

  res.json({
    success: true,
    message: 'Doctor registration submitted. Awaiting admin verification.'
  });
});

// DOCTOR LOGIN
app.post('/api/auth/doctor/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  const doctors = loadJSON('doctors.json');
  const doctor = doctors.find(d => d.email === email && d.password === password);

  if (!doctor) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  if (!doctor.approved) {
    return res.status(403).json({ success: false, error: 'Doctor account not yet approved by admin' });
  }

  res.json({
    success: true,
    user: {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization,
      hospital: doctor.hospital,
      role: 'doctor'
    }
  });
});

// ADMIN LOGIN
app.post('/api/auth/admin/login', (req, res) => {
  const { email, password } = req.body;
  const ADMIN_EMAIL = 'admin@nayana.com';
  const ADMIN_PASSWORD = 'admin123'; // Change in production

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    res.json({
      success: true,
      user: {
        id: 'ADMIN-1',
        name: 'Admin',
        email: ADMIN_EMAIL,
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({ success: false, error: 'Invalid admin credentials' });
  }
});

// ════════════════════════════════════════════════════════════════
// IMAGE UPLOAD & INFERENCE
// ════════════════════════════════════════════════════════════════

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image provided' });
  }

  console.log('✅ Image uploaded:', req.file.filename);
  
  res.json({
    success: true,
    message: 'Image received',
    imagePath: `/received_images/${req.file.filename}`,
    filename: req.file.filename
  });
});

app.post('/api/inference', (req, res) => {
  const { imagePath } = req.body;
  
  if (!imagePath) {
    return res.status(400).json({ success: false, error: 'Image path required' });
  }

  const fullPath = path.join(__dirname, imagePath);
  
  if (!fs.existsSync(fullPath)) {
    return res.status(400).json({ success: false, error: 'Image not found' });
  }

  console.log('🔍 Running inference on:', fullPath);

  const pythonProcess = spawn('python', [
    path.join(__dirname, 'server/python/inference_bridge.py'),
    fullPath
  ]);

  let outputData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Python error:', errorData);
      return res.status(500).json({
        success: false,
        error: 'Inference failed',
        details: errorData
      });
    }

    try {
      const result = JSON.parse(outputData);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: 'Failed to parse results',
        details: err.message
      });
    }
  });
});

// ════════════════════════════════════════════════════════════════
// PATIENT ENDPOINTS
// ════════════════════════════════════════════════════════════════

// Submit screening case
app.post('/api/patient/screening/submit', (req, res) => {
  const {
    patientEmail,
    patientName,
    patientAge,
    patientGender,
    symptoms,
    qualityScore,
    probs,
    detectedConditions,
    riskLevel,
    imagePath,
    heatmapPath
  } = req.body;

  const cases = loadJSON('cases.json');
  
  const newCase = {
    caseId: `CASE-${Date.now()}`,
    patientEmail,
    patientName,
    patientAge,
    patientGender,
    symptoms,
    qualityScore,
    probs: probs || [],
    detectedConditions: detectedConditions || [],
    riskLevel,
    imagePath,
    heatmapPath,
    status: 'Pending',
    doctorDiagnosis: null,
    doctorPrescription: null,
    doctorReferral: null,
    doctorNotes: null,
    reviewedAt: null,
    createdAt: new Date().toISOString()
  };

  cases.push(newCase);
  saveJSON('cases.json', cases);

  res.json({
    success: true,
    caseId: newCase.caseId,
    message: 'Case submitted successfully'
  });
});

// Get patient's cases
app.get('/api/patient/cases/:email', (req, res) => {
  const { email } = req.params;
  const cases = loadJSON('cases.json');
  
  const patientCases = cases.filter(c => c.patientEmail === email);
  
  res.json({
    success: true,
    cases: patientCases
  });
});

// Get patient's appointments
app.get('/api/patient/appointments/:email', (req, res) => {
  const { email } = req.params;
  const appointments = loadJSON('appointments.json');
  
  const patientAppointments = appointments.filter(a => a.patientEmail === email);
  
  res.json({
    success: true,
    appointments: patientAppointments
  });
});

// Book appointment
app.post('/api/patient/appointments', (req, res) => {
  const {
    patientEmail,
    patientName,
    doctorEmail,
    doctorName,
    date,
    timeSlot,
    caseId,
    notes
  } = req.body;

  const appointments = loadJSON('appointments.json');
  
  // Check if slot is already booked
  const isBooked = appointments.some(
    a => a.doctorEmail === doctorEmail && 
         a.date === date && 
         a.timeSlot === timeSlot &&
         ['Pending', 'Confirmed'].includes(a.status)
  );

  if (isBooked) {
    return res.status(400).json({
      success: false,
      error: `Slot ${timeSlot} on ${date} is already booked`
    });
  }

  const appointmentId = `APPT-${appointments.length + 1}`;
  const newAppointment = {
    appointmentId,
    patientEmail,
    patientName,
    doctorEmail,
    doctorName,
    date,
    timeSlot,
    caseId,
    notes,
    status: 'Pending',
    meetLink: null,
    createdAt: new Date().toISOString()
  };

  appointments.push(newAppointment);
  saveJSON('appointments.json', appointments);

  res.json({
    success: true,
    appointmentId: appointmentId,
    message: 'Appointment booked successfully'
  });
});

// Get messages for a case
app.get('/api/messages/:caseId', (req, res) => {
  const { caseId } = req.params;
  const messages = loadJSON('messages.json');
  
  const caseMessages = messages.find(m => m.caseId === caseId);
  
  res.json({
    success: true,
    messages: caseMessages ? caseMessages.messages : []
  });
});

// Send message
app.post('/api/messages/:caseId', (req, res) => {
  const { caseId } = req.params;
  const { senderName, senderRole, text } = req.body;

  const messages = loadJSON('messages.json');
  
  let caseMessages = messages.find(m => m.caseId === caseId);
  
  if (!caseMessages) {
    caseMessages = {
      caseId,
      messages: []
    };
    messages.push(caseMessages);
  }

  caseMessages.messages.push({
    senderName,
    senderRole,
    text,
    timestamp: new Date().toISOString()
  });

  saveJSON('messages.json', messages);

  res.json({
    success: true,
    message: 'Message sent successfully'
  });
});

// ════════════════════════════════════════════════════════════════
// DOCTOR ENDPOINTS
// ════════════════════════════════════════════════════════════════

// Get doctor's cases
app.get('/api/doctor/cases/:email', (req, res) => {
  const { email } = req.params;
  const appointments = loadJSON('appointments.json');
  const cases = loadJSON('cases.json');
  
  const doctorAppointmentCaseIds = appointments
    .filter(a => a.doctorEmail === email)
    .map(a => a.caseId);

  const doctorCases = cases.filter(c => doctorAppointmentCaseIds.includes(c.caseId));
  
  res.json({
    success: true,
    cases: doctorCases
  });
});

// Submit diagnosis for a case
app.post('/api/doctor/cases/:caseId/diagnosis', (req, res) => {
  const { caseId } = req.params;
  const { diagnosis, prescription, referral, notes } = req.body;

  const cases = loadJSON('cases.json');
  const caseIndex = cases.findIndex(c => c.caseId === caseId);

  if (caseIndex === -1) {
    return res.status(404).json({ success: false, error: 'Case not found' });
  }

  cases[caseIndex].doctorDiagnosis = diagnosis;
  cases[caseIndex].doctorPrescription = prescription;
  cases[caseIndex].doctorReferral = referral;
  cases[caseIndex].doctorNotes = notes;
  cases[caseIndex].status = 'Reviewed';
  cases[caseIndex].reviewedAt = new Date().toISOString();

  saveJSON('cases.json', cases);

  res.json({
    success: true,
    message: 'Diagnosis submitted successfully'
  });
});

// Get doctor's appointments
app.get('/api/doctor/appointments/:email', (req, res) => {
  const { email } = req.params;
  const appointments = loadJSON('appointments.json');
  
  const doctorAppointments = appointments.filter(a => a.doctorEmail === email);
  
  res.json({
    success: true,
    appointments: doctorAppointments
  });
});

// Update appointment status
app.put('/api/doctor/appointments/:appointmentId/status', (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body;

  const appointments = loadJSON('appointments.json');
  const appointmentIndex = appointments.findIndex(a => a.appointmentId === appointmentId);

  if (appointmentIndex === -1) {
    return res.status(404).json({ success: false, error: 'Appointment not found' });
  }

  appointments[appointmentIndex].status = status;
  
  // Generate Jitsi link if confirmed
  if (status === 'Confirmed' && !appointments[appointmentIndex].meetLink) {
    const apptId = appointmentId.toLowerCase().replace(/-/g, '');
    appointments[appointmentIndex].meetLink = `https://meet.jit.si/nayana-${apptId}`;
  }

  saveJSON('appointments.json', appointments);

  res.json({
    success: true,
    message: 'Appointment status updated'
  });
});

// ════════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ════════════════════════════════════════════════════════════════

// Get pending doctors
app.get('/api/admin/pending-doctors', (req, res) => {
  const doctors = loadJSON('doctors.json');
  const pendingDoctors = doctors.filter(d => !d.approved);
  
  res.json({
    success: true,
    doctors: pendingDoctors
  });
});

// Approve doctor
app.post('/api/admin/doctors/:email/approve', (req, res) => {
  const { email } = req.params;
  const doctors = loadJSON('doctors.json');
  
  const doctorIndex = doctors.findIndex(d => d.email === email);
  
  if (doctorIndex === -1) {
    return res.status(404).json({ success: false, error: 'Doctor not found' });
  }

  doctors[doctorIndex].approved = true;
  saveJSON('doctors.json', doctors);

  res.json({
    success: true,
    message: `Dr. ${doctors[doctorIndex].name} approved successfully`
  });
});

// Reject doctor
app.post('/api/admin/doctors/:email/reject', (req, res) => {
  const { email } = req.params;
  const doctors = loadJSON('doctors.json');
  
  const doctorIndex = doctors.findIndex(d => d.email === email);
  
  if (doctorIndex === -1) {
    return res.status(404).json({ success: false, error: 'Doctor not found' });
  }

  doctors.splice(doctorIndex, 1);
  saveJSON('doctors.json', doctors);

  res.json({
    success: true,
    message: 'Doctor application rejected'
  });
});

// ════════════════════════════════════════════════════════════════
// SHARED ENDPOINTS
// ════════════════════════════════════════════════════════════════

// Get all approved doctors (for patient to book appointments)
app.get('/api/doctors', (req, res) => {
  const doctors = loadJSON('doctors.json');
  const approvedDoctors = doctors.filter(d => d.approved);
  
  res.json({
    success: true,
    doctors: approvedDoctors
  });
});

// ════════════════════════════════════════════════════════════════
// STATIC FILE SERVING & FALLBACK
// ════════════════════════════════════════════════════════════════

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/public/index.html'));
});

// Catch-all for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/public/index.html'));
});

// ════════════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`\n✅ Nayana API running on http://localhost:${PORT}\n`);
  console.log('📍 Auth endpoints: /api/auth/*');
  console.log('📍 Patient endpoints: /api/patient/*');
  console.log('📍 Doctor endpoints: /api/doctor/*');
  console.log('📍 Admin endpoints: /api/admin/*');
  console.log('📍 Messaging: /api/messages/*\n');
});

module.exports = app;
