const { useState, useEffect } = React;

function App() {
  const [image, setImage] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (data.success) {
        setImage(data.imagePath);
        await runInference();
      }
    } catch (err) {
      setError('Upload failed: ' + err.message);
      setLoading(false);
    }
  };

  const runInference = async () => {
    setLoading(true);
    try {
      const response = await fetch('/inference', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data);
      }
    } catch (err) {
      setError('Inference failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const scheduleAppointment = () => {
    const apt = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      status: 'Pending',
      jitsiLink: `https://meet.jit.si/nayana-${Date.now()}`
    };
    setAppointments([...appointments, apt]);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🔍 Nayana.ai Eye Screening</h1>
        <p>AI-Powered Tele-Ophthalmology</p>
      </header>

      <main className="main">
        <section className="upload-section">
          <h2>Upload Eye Image</h2>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload}
            disabled={loading}
          />
          {loading && <p className="loading">🔄 Processing...</p>}
          {error && <p className="error">❌ {error}</p>}
        </section>

        {image && (
          <section className="image-section">
            <h3>Captured Image</h3>
            <img src={image} alt="Eye" className="eye-image" />
          </section>
        )}

        {results && (
          <section className="results-section">
            <h3>✅ Diagnostic Results</h3>
            <div className="results-card">
              <div className="primary-diagnosis">
                <h4>Primary Diagnosis</h4>
                <p className="diagnosis-text">{results.primary_diagnosis}</p>
                <p className="confidence">Confidence: {(results.confidence * 100).toFixed(2)}%</p>
              </div>

              <div className="segmentation-results">
                <div className="model-results">
                  <h5>Anterior Segment Analysis</h5>
                  {Object.entries(results.anterior_segment || {}).map(([label, prob]) => (
                    <div key={label} className="prediction-bar">
                      <span>{label}</span>
                      <div className="bar-container">
                        <div 
                          className="bar" 
                          style={{ width: (prob * 100) + '%' }}
                        ></div>
                      </div>
                      <span className="percentage">{(prob * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>

                <div className="model-results">
                  <h5>Fundus/Retinal Analysis</h5>
                  {Object.entries(results.fundus || {}).map(([label, prob]) => (
                    <div key={label} className="prediction-bar">
                      <span>{label}</span>
                      <div className="bar-container">
                        <div 
                          className="bar" 
                          style={{ width: (prob * 100) + '%' }}
                        ></div>
                      </div>
                      <span className="percentage">{(prob * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="appointment-btn" onClick={scheduleAppointment}>
                Schedule Doctor Appointment
              </button>
            </div>
          </section>
        )}

        <section className="appointments-section">
          <h3>Your Appointments</h3>
          {appointments.length === 0 ? (
            <p>No appointments scheduled</p>
          ) : (
            <div className="appointments-list">
              {appointments.map(apt => (
                <div key={apt.id} className="appointment-card">
                  <p><strong>{apt.date}</strong></p>
                  <p>Status: {apt.status}</p>
                  {apt.jitsiLink && (
                    <a href={apt.jitsiLink} target="_blank" rel="noreferrer">
                      🎥 Join Video Call
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));