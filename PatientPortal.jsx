import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// In a real app, these would be separate files
// But for speed, I'm showing you the structure

function PatientPortal() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [page, setPage] = useState('screening');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#13131f' }}>
      {/* NAVBAR (LEFT SIDE) */}
      <PatientNavbar 
        user={user} 
        currentPage={page} 
        setPage={setPage} 
        onLogout={() => {
          logout();
          navigate('/');
        }}
      />

      {/* MAIN CONTENT (RIGHT SIDE) */}
      <div style={{ flex: 1, padding: '40px' }}>
        {page === 'screening' && <ScreeningPage user={user} />}
        {page === 'results' && <ResultsPage user={user} />}
        {page === 'appointments' && <AppointmentsPage user={user} />}
        {page === 'health_record' && <HealthRecordPage user={user} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NAVBAR COMPONENT
// ═══════════════════════════════════════════════════════════════

function PatientNavbar({ user, currentPage, setPage, onLogout }) {
  return (
    <div style={{
      width: '280px',
      background: '#1a1a2e',
      padding: '20px',
      borderRight: '1px solid rgba(129,140,248,0.2)',
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* HEADER */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b' }}>nayana</div>
        <div style={{ fontSize: '11px', color: '#475569' }}>AI Eye Screening</div>
      </div>

      {/* USER INFO */}
      <div style={{
        background: 'rgba(99,102,241,0.1)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '15px', fontWeight: '700' }}>{user?.name}</div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>Patient</div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{user?.email}</div>
      </div>

      {/* NAVIGATION BUTTONS */}
      <div style={{ marginBottom: '20px' }}>
        <NavButton 
          label="Screening" 
          active={currentPage === 'screening'} 
          onClick={() => setPage('screening')}
        />
        <NavButton 
          label="Results" 
          active={currentPage === 'results'} 
          onClick={() => setPage('results')}
        />
        <NavButton 
          label="Appointments" 
          active={currentPage === 'appointments'} 
          onClick={() => setPage('appointments')}
        />
        <NavButton 
          label="Health Record" 
          active={currentPage === 'health_record'} 
          onClick={() => setPage('health_record')}
        />
      </div>

      {/* SPACER */}
      <div style={{ flex: 1 }} />

      {/* LOGOUT */}
      <button
        onClick={onLogout}
        style={{
          background: '#e63946',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px',
          cursor: 'pointer',
          fontWeight: 'bold',
          width: '100%'
        }}
      >
        Sign Out
      </button>
    </div>
  );
}

function NavButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? '#4f46e5' : 'transparent',
        color: '#e2e8f0',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 16px',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        marginBottom: '8px',
        fontWeight: active ? '700' : '400'
      }}
    >
      {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE 1: SCREENING
// ═══════════════════════════════════════════════════════════════

function ScreeningPage({ user }) {
  const [step, setStep] = useState(1);
  const [symptoms, setSymptoms] = useState('');
  const [frontImage, setFrontImage] = useState(null);
  const [fundusImage, setFundusImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScreeningSubmit = async () => {
    if (!fundusImage) {
      alert('Please upload fundus image');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload image
      const formData = new FormData();
      formData.append('image', fundusImage);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();

      // 2. Run inference
      const inferenceRes = await fetch('/api/inference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePath: uploadData.imagePath })
      });
      const inferenceData = await inferenceRes.json();

      // 3. Save case
      const caseRes = await fetch('/api/patient/screening/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientEmail: user.email,
          patientName: user.name,
          patientAge: user.age,
          patientGender: user.gender,
          symptoms: symptoms,
          qualityScore: 85,
          probs: inferenceData.data?.fundus || [],
          detectedConditions: [],
          riskLevel: 'Moderate',
          imagePath: uploadData.imagePath
        })
      });
      const caseData = await caseRes.json();

      alert('Screening submitted! Case ID: ' + caseData.caseId);
      setStep(1);
      setSymptoms('');
      setFrontImage(null);
      setFundusImage(null);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Eye Screening</h1>

      {step === 1 && (
        <div>
          <h3>Step 1: Tell us your symptoms</h3>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describe any eye symptoms you're experiencing..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(129,140,248,0.3)',
              background: '#1a1a2e',
              color: '#e2e8f0'
            }}
          />
          <button 
            onClick={() => setStep(2)}
            style={{ marginTop: '20px', padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px' }}
          >
            Next: Upload Images
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3>Step 2: Upload Eye Images</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4>Front Eye Photo</h4>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFrontImage(e.target.files[0])}
              style={{ padding: '10px' }}
            />
            {frontImage && <p>✅ Front eye selected</p>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4>Fundus/Retinal Image</h4>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFundusImage(e.target.files[0])}
              style={{ padding: '10px' }}
            />
            {fundusImage && <p>✅ Fundus image selected</p>}
          </div>

          <button 
            onClick={() => setStep(1)}
            style={{ marginRight: '10px', padding: '10px 20px', background: '#666', color: 'white', border: 'none', borderRadius: '8px' }}
          >
            Back
          </button>
          <button 
            onClick={handleScreeningSubmit}
            disabled={loading}
            style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px' }}
          >
            {loading ? 'Processing...' : 'Analyze & Submit'}
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE 2: RESULTS
// ═══════════════════════════════════════════════════════════════

function ResultsPage({ user }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await fetch(`/api/patient/cases/${user.email}`);
      const data = await res.json();
      setCases(data.cases || []);
    } catch (error) {
      alert('Error fetching cases: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Results</h1>
      {cases.length === 0 ? (
        <p>No screening cases yet. Go to Screening to submit one.</p>
      ) : (
        cases.map(caseItem => (
          <div key={caseItem.caseId} style={{
            background: '#1a1a2e',
            padding: '20px',
            marginBottom: '15px',
            borderRadius: '12px',
            borderLeft: '4px solid #4f46e5'
          }}>
            <h3>{caseItem.caseId}</h3>
            <p>Status: {caseItem.status}</p>
            <p>Risk Level: {caseItem.riskLevel}</p>
            
            {caseItem.status === 'Reviewed' && (
              <div style={{ background: '#0f3460', padding: '10px', marginTop: '10px', borderRadius: '8px' }}>
                <p><strong>Doctor's Diagnosis:</strong> {caseItem.doctorDiagnosis}</p>
                <p><strong>Treatment:</strong> {caseItem.doctorPrescription}</p>
                <p><strong>Follow-up:</strong> {caseItem.doctorReferral}</p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE 3: APPOINTMENTS
// ═══════════════════════════════════════════════════════════════

function AppointmentsPage({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`/api/patient/appointments/${user.email}`);
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div>
      <h1>My Appointments</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Book New Appointment</h3>
        {doctors.map(doctor => (
          <div key={doctor.email} style={{
            background: '#1a1a2e',
            padding: '15px',
            marginBottom: '10px',
            borderRadius: '8px'
          }}>
            <p><strong>Dr. {doctor.name}</strong> - {doctor.specialization}</p>
            <p>{doctor.hospital}</p>
            {/* In real implementation, add calendar picker and time slot selector */}
          </div>
        ))}
      </div>

      <div>
        <h3>Upcoming Appointments</h3>
        {appointments.length === 0 ? (
          <p>No appointments yet</p>
        ) : (
          appointments.map(apt => (
            <div key={apt.appointmentId} style={{
              background: '#1a1a2e',
              padding: '15px',
              marginBottom: '10px',
              borderRadius: '8px'
            }}>
              <p><strong>{apt.appointmentId}</strong></p>
              <p>Dr. {apt.doctorName}</p>
              <p>{apt.date} at {apt.timeSlot}</p>
              <p>Status: {apt.status}</p>
              {apt.meetLink && <a href={apt.meetLink} target="_blank">Join Video Call</a>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE 4: HEALTH RECORD
// ═══════════════════════════════════════════════════════════════

function HealthRecordPage({ user }) {
  return (
    <div>
      <h1>Health Record</h1>
      <p>Patient: {user.name}</p>
      <p>Age: {user.age}</p>
      <p>Gender: {user.gender}</p>
      {/* Add more details here */}
    </div>
  );
}

export default PatientPortal;
