# NAYANA.AI API — IMPLEMENTATION CHECKLIST
## Surgical Precision Step-by-Step Guide

**Total Time: 6 hours**  
**Complexity: HIGH**  
**Status: READY TO START**

---

## ✅ PRE-IMPLEMENTATION CHECKLIST

Before you start, verify you have:
- [x] Node.js installed
- [x] Python 3 installed
- [x] Git Bash or Command Prompt
- [x] VS Code
- [x] Models in `nayana-api/models/`
- [x] Current `nayana-api/` folder with `package.json`

---

## 🚀 PHASE 1: BACKEND SETUP (45 minutes)

### STEP 1.1: Backup old files
```bash
# In nayana-api directory:
cd nayana-api
cp server/api.js server/api.js.backup
```

### STEP 1.2: Replace api.js with new version
**Location:** `nayana-api/server/api.js`

1. Open the file `api.js` (provided in outputs)
2. Copy ALL content from the provided `api.js`
3. Replace your entire `server/api.js` with this new code
4. **Do NOT edit anything** - paste exactly as-is

### STEP 1.3: Update package.json
Add these packages to `dependencies`:

**Current package.json should have:**
```json
{
  "name": "nayana-api",
  "version": "1.0.0",
  "main": "server/api.js",
  "scripts": {
    "start": "node server/api.js",
    "dev": "nodemon server/api.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.0.0",
    "axios": "^1.4.0",
    "sharp": "^0.32.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.11.0",
    "zustand": "^4.3.8"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

### STEP 1.4: Install dependencies
```bash
npm install react-router-dom zustand axios
```

### STEP 1.5: Verify api.js syntax
```bash
node -c server/api.js
# Should output: [no output = syntax OK]
```

✅ **Backend is now ready**

---

## 🎨 PHASE 2: MOCK DATABASE SETUP (15 minutes)

### STEP 2.1: Create data directory
```bash
mkdir data
mkdir docs
mkdir cases_images
```

### STEP 2.2: Copy sample data files into /data folder
**Create these files in `nayana-api/data/`:**

1. **patients.json** → Copy from provided `patients.json`
2. **doctors.json** → Copy from provided `doctors.json`
3. **cases.json** → Copy from provided `cases.json`
4. **appointments.json** → Copy from provided `appointments.json`
5. **messages.json** → Copy from provided `messages.json`

Each file should be a valid JSON array/object.

### STEP 2.3: Verify data files
```bash
# Optional: Pretty-print to check syntax
cat data/patients.json
```

✅ **Mock database is ready**

---

## 🏗️ PHASE 3: FRONTEND FOLDER RESTRUCTURE (10 minutes)

### STEP 3.1: Create new folder structure
```bash
# From nayana-api root:
mkdir -p frontend/src/pages
mkdir -p frontend/src/components
mkdir -p frontend/src/store
mkdir -p frontend/src/styles
```

### STEP 3.2: Move files
```bash
# Move index.html to correct location
mv frontend/public/index.html frontend/public/index.html.bak

# We'll create a new index.html next
```

### STEP 3.3: Create new index.html
**File:** `frontend/public/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nayana.ai - Eye Screening</title>
  <link rel="stylesheet" href="/styles/global.css">
</head>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/react-router-dom@6/dist/index.umd.production.min.js"></script>
  <script src="https://unpkg.com/zustand@4/dist/index.umd.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="text/babel" src="/index.jsx"></script>
</body>
</html>
```

### STEP 3.4: Copy auth store
**File:** `frontend/src/store/authStore.js`

Copy the provided `authStore.js` into this location.

✅ **Frontend structure is ready**

---

## 📝 PHASE 4: COMPONENT CREATION (2.5 hours)

### OVERVIEW OF COMPONENTS TO CREATE:

```
frontend/src/
├── pages/
│   ├── Landing.jsx          (Role selection - 150 lines)
│   ├── PatientAuth.jsx      (Login/Register - 200 lines)
│   ├── PatientPortal.jsx    (Main patient dashboard - 400 lines)
│   ├── DoctorAuth.jsx       (Doctor login - 150 lines)
│   ├── DoctorPortal.jsx     (Doctor dashboard - 400 lines)
│   ├── AdminAuth.jsx        (Admin login - 100 lines)
│   └── AdminPortal.jsx      (Doctor verification - 200 lines)
├── components/
│   ├── PatientNavbar.jsx    (Reusable - 150 lines)
│   ├── DoctorNavbar.jsx     (Reusable - 150 lines)
│   ├── Chat.jsx             (Reusable - 180 lines)
│   └── Screening/
│       ├── Step1Symptoms.jsx (Chatbot - 200 lines)
│       ├── Step2Photos.jsx   (Camera upload - 250 lines)
│       └── Step3Results.jsx  (Display results - 300 lines)
├── App.jsx                   (Router setup - 50 lines)
└── index.jsx                (React render - 10 lines)
```

### IMPLEMENTATION ORDER (FASTEST FIRST):

#### 1️⃣ CREATE: `frontend/src/index.jsx` (5 min)
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
```

#### 2️⃣ CREATE: `frontend/src/App.jsx` (10 min)
Copy the provided `App.jsx` exactly

#### 3️⃣ CREATE: `frontend/src/pages/Landing.jsx` (20 min)
This is the simplest - just 3 buttons for role selection.

**Template:**
```jsx
export default function Landing() {
  const navigate = useNavigate();
  
  return (
    <div className="nayana-hero">
      <h1>nayana</h1>
      <p>Free AI eye screening — 3 minutes</p>
      <button onClick={() => navigate('/patient/auth')}>Patient</button>
      <button onClick={() => navigate('/doctor/auth')}>Doctor</button>
      <button onClick={() => navigate('/admin/auth')}>Admin</button>
    </div>
  );
}
```

#### 4️⃣ CREATE: `frontend/src/pages/PatientAuth.jsx` (30 min)
Two tabs: Sign In | Create Account

**Key state:**
- email, password for login
- name, age, gender, email, password for register

**API calls:**
- POST `/api/auth/patient/login`
- POST `/api/auth/patient/register`

#### 5️⃣ CREATE: `frontend/src/pages/PatientPortal.jsx` (90 min)
**This is the main section. Has 3 sub-pages:**

1. **Screening** (3 steps)
   - Step 1: Chatbot symptoms → state
   - Step 2: Upload front eye + fundus images → POST `/api/upload`
   - Step 3: Display results → POST `/api/patient/screening/submit`

2. **Results** (case history)
   - GET `/api/patient/cases/:email`
   - Display each case with doctor feedback

3. **Appointments** (calendar)
   - GET `/api/patient/appointments/:email`
   - POST `/api/patient/appointments` (book new)

#### 6️⃣ CREATE: `frontend/src/pages/DoctorAuth.jsx` (20 min)
Similar to PatientAuth but for doctors

#### 7️⃣ CREATE: `frontend/src/pages/DoctorPortal.jsx` (80 min)
**Has 3 sub-pages:**

1. **Cases** - GET `/api/doctor/cases/:email`, submit diagnosis
2. **Appointments** - GET `/api/doctor/appointments/:email`, update status
3. **Messages** - GET `/api/messages/:caseId`

#### 8️⃣ CREATE: `frontend/src/pages/AdminAuth.jsx` (10 min)
Simple login form (email + password)

#### 9️⃣ CREATE: `frontend/src/pages/AdminPortal.jsx` (30 min)
Doctor verification dashboard
- GET `/api/admin/pending-doctors`
- POST `/api/admin/doctors/:email/approve`
- POST `/api/admin/doctors/:email/reject`

#### 🔟 CREATE: `frontend/src/components/Chat.jsx` (20 min)
Reusable chat widget
- GET `/api/messages/:caseId`
- POST `/api/messages/:caseId`

#### 1️⃣1️⃣ CREATE: Global Styles
**File:** `frontend/src/styles/global.css`

Copy ALL CSS from original Streamlit app.css

---

## 🎯 PHASE 5: STYLING (30 minutes)

### STEP 5.1: Copy all Streamlit CSS
The old Streamlit app has styles defined in:
```python
st.markdown(load_css(st.session_state['dark_mode']), unsafe_allow_html=True)
```

From document, extract the CSS definitions and put into:
**File:** `frontend/public/styles/global.css`

Key classes to preserve:
- `.nayana-hero`
- `.portal-card`
- `.page-title`
- `.step-bar`
- `.risk-pill`
- `.card`
- `.appointment-card`
- `.chat-container`

### STEP 5.2: Tailwind alternative (FASTER)
If you want to go faster, use inline Tailwind:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Then use Tailwind classes in JSX instead of custom CSS.

✅ **Styling complete**

---

## 🧪 PHASE 6: TESTING (30 minutes)

### TEST 1: Start backend
```bash
npm start
# Should see:
# ✅ Nayana API running on http://localhost:5000
```

### TEST 2: Test endpoints with curl
```bash
# Test patient registration
curl -X POST http://localhost:5000/api/auth/patient/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","age":30,"gender":"M","email":"test@test.com","password":"test123"}'

# Should return: {"success":true,"message":"..."}
```

### TEST 3: Open frontend
```
Browser → http://localhost:5000
```

Should see Landing page with 3 buttons.

### TEST 4: Complete signup flow
1. Click "Patient"
2. Create account
3. Login
4. Should see Screening page

### TEST 5: Doctor approval flow
1. Register as doctor
2. Login as admin (admin@nayana.com / admin123)
3. Approve the doctor
4. Doctor should now be able to login

---

## 📊 COMPLETION CHECKLIST

### Backend (5 items)
- [ ] Replaced `server/api.js` with new code
- [ ] All npm packages installed
- [ ] `/data/` folder created with 5 JSON files
- [ ] `docs/` folder created
- [ ] `npm start` runs without errors

### Frontend Structure (5 items)
- [ ] `/frontend/src/` folder created
- [ ] `/frontend/src/store/authStore.js` created
- [ ] New `index.html` created
- [ ] All component folders exist
- [ ] `/frontend/public/styles/global.css` exists

### React Components (10 items)
- [ ] `App.jsx` with Router
- [ ] `Landing.jsx`
- [ ] `PatientAuth.jsx`
- [ ] `PatientPortal.jsx`
- [ ] `DoctorAuth.jsx`
- [ ] `DoctorPortal.jsx`
- [ ] `AdminAuth.jsx`
- [ ] `AdminPortal.jsx`
- [ ] `Chat.jsx`
- [ ] All sub-components complete

### Testing (5 items)
- [ ] Backend starts successfully
- [ ] Landing page displays
- [ ] Patient signup works
- [ ] Patient login works
- [ ] Doctor approval flow works

---

## 🔥 IF YOU GET STUCK

### Error: "Cannot find module 'react-router-dom'"
```bash
npm install react-router-dom
```

### Error: "Cannot POST /api/auth/patient/register"
Check:
1. Is `api.js` in `server/` folder? Yes
2. Did you replace the ENTIRE file? Yes
3. Is there a syntax error? Run: `node -c server/api.js`

### Error: "Cannot find 'patients.json'"
Check:
1. Create `/data/` folder: `mkdir data`
2. Create `data/patients.json` with the sample JSON
3. Restart: `npm start`

### React component not displaying
Check:
1. Is it imported in the page? `import Component from '...'`
2. Is it exported? `export default Component`
3. React Router path correct? `<Route path="/..." element={<Component />} />`

---

## 📞 FINAL CHECKLIST BEFORE SUBMITTING TO JUDGES

### Functionality
- [ ] Landing page has 3 role buttons
- [ ] Patient can register/login
- [ ] Doctor can register/login
- [ ] Admin can login and verify doctors
- [ ] Patient can submit screening (3-step flow)
- [ ] Doctor can view cases and submit diagnosis
- [ ] Chat works between patient and doctor
- [ ] Appointments can be booked
- [ ] All API endpoints return correct JSON

### UI/UX
- [ ] Dark mode working
- [ ] All pages styled (not just text)
- [ ] Forms have proper validation
- [ ] Error messages display
- [ ] Loading states visible
- [ ] Navigation works smoothly

### Performance
- [ ] Page loads < 2 seconds
- [ ] API responses < 500ms
- [ ] No console errors
- [ ] Images optimize properly

### Demo Script for Judges
```
1. Open landing page → Click "Patient"
2. Register new account
3. Login
4. Start screening → Fill symptoms → Upload eye photo → See AI results
5. Book appointment with doctor
6. Switch role → Doctor portal
7. Review patient case → Submit diagnosis
8. Switch role → Admin portal
9. Verify pending doctor
10. Switch back to patient → See doctor's diagnosis
```

---

## 🎊 YOU'RE DONE!

Once everything is working, you have:
✅ Full-stack tele-ophthalmology API  
✅ 3 user roles with authentication  
✅ AI integration (upload + inference)  
✅ Appointment booking system  
✅ Patient-doctor messaging  
✅ Admin verification dashboard  
✅ Production-ready structure  

**Total development time: 6 hours**  
**Judge presentation time: 10 minutes**

---

## 🎁 BONUS FEATURES (If you have extra time)

1. **PDF Report Generation**
   - npm install pdfkit
   - Generate PDF from case data
   - Download button in results

2. **Email Notifications**
   - npm install nodemailer
   - Send appointment confirmations

3. **Real-time Chat**
   - npm install socket.io
   - Upgrade from polling to WebSockets

4. **Google Maps Integration**
   - Embed map to find nearby eye hospitals

5. **Mobile Responsive**
   - Use React Native or responsive CSS
   - Test on mobile phone

---

**GOOD LUCK! YOU GOT THIS! 🚀**

