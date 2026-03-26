import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Store
import { useAuthStore } from './store/authStore';

// Pages
import Landing from './pages/Landing';
import PatientAuth from './pages/PatientAuth';
import PatientPortal from './pages/PatientPortal';
import DoctorAuth from './pages/DoctorAuth';
import DoctorPortal from './pages/DoctorPortal';
import AdminAuth from './pages/AdminAuth';
import AdminPortal from './pages/AdminPortal';

function App() {
  const { user, token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking session
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ fontSize: '18px', color: '#818cf8' }}>Loading Nayana...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Landing - visible to everyone */}
        <Route path="/" element={<Landing />} />

        {/* Patient Routes */}
        <Route path="/patient/auth" element={!user ? <PatientAuth /> : <Navigate to="/patient" />} />
        <Route path="/patient/*" element={user?.role === 'patient' ? <PatientPortal /> : <Navigate to="/" />} />

        {/* Doctor Routes */}
        <Route path="/doctor/auth" element={!user ? <DoctorAuth /> : <Navigate to="/doctor" />} />
        <Route path="/doctor/*" element={user?.role === 'doctor' ? <DoctorPortal /> : <Navigate to="/" />} />

        {/* Admin Routes */}
        <Route path="/admin/auth" element={!user ? <AdminAuth /> : <Navigate to="/admin" />} />
        <Route path="/admin/*" element={user?.role === 'admin' ? <AdminPortal /> : <Navigate to="/" />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
