# Nayana AI — Agent Context

## What this project is
Nayana is a medical AI eye-screening platform built for a hackathon submission.
It began as a Python/Streamlit prototype (`../nayana-eye-screening/`) and was
ported to a Node.js/Express backend with a single-file Vanilla JS frontend.

## Tech stack
- **Backend:** Node.js + Express 4, Multer (file uploads), no database — JSON
  files in `data/` act as persistence
- **Frontend:** `frontend/public/index.html` — one self-contained HTML file
  with inline CSS and Vanilla JS. No build step, no framework.
- **AI inference:** Simulated in the browser (weighted-random diagnosis). The
  original Python models live in `../nayana-eye-screening/*.pth` and the bridge
  script is at `server/python/inference_bridge.py` but is not wired up in the
  current JS version.
- **PDF:** `jsPDF` loaded from CDN inside index.html
- **Port:** 5000 by default, but macOS Monterey+ blocks 5000 (AirPlay). Use
  `PORT=4321 npm start` locally.

## Project structure
```
nayana-api/
├── index.js                  # Entry point — just requires server/api.js
├── server/
│   └── api.js                # All Express routes (auth, cases, upload, admin)
├── frontend/
│   └── public/
│       └── index.html        # Complete SPA (HTML + CSS + JS, ~700 lines)
├── data/                     # JSON flat-file DB (gitignored)
│   ├── patients.json
│   ├── doctors.json
│   └── cases.json
├── doctor_docs/              # Uploaded doctor certificates (gitignored)
├── received_images/          # Uploaded eye images (gitignored)
└── package.json
```

## Running locally
```bash
npm install
PORT=4321 npm start        # or: PORT=4321 node index.js
# open http://localhost:4321
```

## Key credentials (hardcoded for demo)
| Role  | Username / Email | Password  |
|-------|-----------------|-----------|
| Admin | admin           | admin123  |
| Patient | register via UI | any       |
| Doctor  | register via UI | pending admin approval |

## API routes
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/patient/register` | Register patient |
| POST | `/api/auth/patient/login` | Patient login |
| POST | `/api/auth/doctor/register` | Doctor register (multipart, `certificate` field) |
| POST | `/api/auth/doctor/login` | Doctor login — 403 if pending/rejected |
| POST | `/api/auth/admin/login` | Admin login (`admin`/`admin123`) |
| GET  | `/api/admin/doctors` | All doctors (any status) |
| POST | `/api/admin/doctors/:email/approve` | Approve doctor |
| POST | `/api/admin/doctors/:email/reject`  | Reject doctor |
| GET  | `/api/admin/doctors/:email/certificate` | Stream uploaded cert file |
| GET  | `/api/doctors` | Approved doctors only (for patient send-report) |
| POST | `/api/upload/eye` | Upload eye image (multipart, `image` field) |
| POST | `/api/cases` | Save a screening case |
| GET  | `/api/cases/patient/:email` | Patient's cases |
| GET  | `/api/cases/doctor/:email` | Cases sent to a doctor |
| PUT  | `/api/cases/:caseId/review` | Doctor marks case reviewed |

## Frontend SPA — how it works
All business logic lives in `index.html`. localStorage is the mock database:
- `nayana_users` — `{ patients: {email: {...}}, doctors: {email: {...}} }`
- `nayana_cases` — array of screening cases
- `nayana_session` — current logged-in user `{ role, user }`
- `nayana_theme` — `'dark'` or `'light'`
- `nayana_lang` — `'en'`, `'hi'`, or `'kn'`

The server API is used only for file uploads (eye images, certificates). All
auth, case creation, and approval state is handled purely in localStorage so
the app works offline after the first page load.

### Send-to-Doctor logic
When a patient finishes a screening, the app calls `DB.getApprovedDoctors()`
which reads `nayana_users.doctors` from localStorage and filters by
`verificationStatus === 'approved'`. If the list is empty, the send button is
hidden and "No specialists available" is shown. If doctors exist, a dropdown
is shown. The admin `approveDoctor()` function updates the same localStorage
key, so approval takes effect immediately without a page reload.

## Diagnoses the AI simulation returns
`Normal`, `Cataract`, `Diabetic Retinopathy`, `Glaucoma` — weighted random
(35% / 25% / 25% / 15%). Each has hardcoded disease info, urgency level, and
3 static nearby hospitals shown in the results.

## i18n
Full translations for English (`en`), Hindi (`hi`), and Kannada (`kn`) are
in the `T` object in `index.html`. Every UI string that needs translation has
a `data-i18n="key"` attribute. `applyLang()` iterates them on language change.

## What the Streamlit prototype has that this version doesn't (yet)
- Real PyTorch inference (EfficientNet-B0 + GradCAM heatmap)
- Encrypted JSON storage (Fernet)
- Appointment booking + Jitsi meet links
- Patient-doctor in-app messaging per case
- Blockchain audit trail (`blockchain.py`)
- Full patient health record / medical history views

## Owner / contacts
- Repo owner: medhabalaji (GitHub)
- Developer: Raghav Jeyaraman (raghavj@gmail.com)
