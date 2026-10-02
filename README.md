# 🏏 Cricket Clips Dashboard

> An AI-powered platform to manage, label, search, and moderate cricket video clips — built for analysts, editors, and content teams who need structured access to a large cricket video library.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green)
![React](https://img.shields.io/badge/React-18.x-blue)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Data Models](#-data-models)
- [API Endpoints](#-api-endpoints)
- [Role-Based Access](#-role-based-access)
- [Moderation & Flag System](#-moderation--flag-system)
- [Scripts & Pipelines](#-scripts--pipelines)
- [Performance Notes](#-performance-notes)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Cricket Clips Dashboard** is a full-stack web application designed to solve a simple but hard problem:

> "How do you turn hundreds of hours of cricket footage into a searchable, labeled, and modifiable clip library?"

It combines:

- **Video clip ingestion** from raw footage (via OCR + timestamps)
- **AI-assisted labeling** (shot type, ball type, direction, connection, wicket type)
- **Interactive search** across 50+ filter dimensions
- **Moderation workflows** for user-reported and admin-flagged clips
- **Playlist management** for curating personal and shared collections
- **Role-based contribution** so community members and freelancers can help keep data accurate

---

## ✨ Features

### 🎬 Clip Management
- Upload and organize clips per match
- Auto-generated thumbnails and durations
- Trim clips directly in the browser (FFmpeg + VideoTrimmer)
- Merge multiple clips into a single highlight reel
- Bulk download selected clips

### 🔍 Advanced Search
- Filter by **batsman**, **bowler**, **event**, **shot type**, **ball type**, **direction**, **length**, **connection**, **wicket type**, and 40+ more dimensions
- Full-text search across commentary
- Duration range and over range filters
- Flag status, review status, and reason filters
- Real-time filter state in the URL (shareable links)

### 🏷️ Automated Labeling
- Shot type detection (Cover Drive, Pull, Sweep, etc.)
- Ball type detection (Yorker, Googly, Off Cutter, etc.)
- Direction detection (Long On, Deep Cover, etc.)
- Wicket type classification (Bowled, Caught, LBW, Run Out, Stumped)
- Powerplay detection based on over number
- Confidence scoring and conflict detection

### 🚩 Moderation & Flagging
- Users can flag clips with a reason
- Admin dashboard shows **who flagged what and why**
- Flagger accuracy tracking (accepted vs dismissed flags)
- Auto-flag risky users (accuracy < 50% with 3+ dismissed)
- Ban / unban users directly from the moderation panel
- Audit trail for every flag action

### 🎵 Playlists
- Create public, private, or collaborative playlists
- Add / remove clips from playlists
- Search within playlists
- Share playlists via unique links
- Edit playlist title and clip order

### 👥 Role-Based Access
- **Users** – view, search, download, report, add to playlist
- **Crowd** – same as users + fix clips, earn reputation points
- **Freelancers** – same as crowd + earn per-fix rewards
- **Admins** – full control: edit, delete, bulk update, ban, distribute rewards

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Redux, React Router, TailwindCSS, shadcn/ui, Lucide Icons |
| **Backend** | Node.js, Express, Mongoose |
| **Database** | MongoDB (Atlas or self-hosted) |
| **Auth** | JWT, email OTP, Google OAuth, GitHub OAuth |
| **Storage** | Firebase Storage / local file system |
| **Video** | FFmpeg (via `fluent-ffmpeg`), VideoTrimmer |
| **AI / ML** | Python: `rembg`, OpenCV, YOLOv8, EasyOCR, Whisper |
| **Payments** | Razorpay |
| **Notifications** | Firebase Cloud Messaging |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT (React)                        │
│  Dashboard │ Playlists │ Flag Moderation │ User Management  │
└────────────────────┬────────────────────────────────────────┘
                     │  REST API
┌────────────────────▼────────────────────────────────────────┐
│                    SERVER (Node/Express)                    │
│  Clips │ Matches │ Players │ Playlists │ Auth │ Tasks       │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌────────┐  ┌─────────┐  ┌───────────┐
   │ MongoDB│  │Firebase │  │  FFmpeg   │
   │  (Data)│  │ (Storage│  │  (Video)  │
   │        │  │ + FCM)  │  │           │
   └────────┘  └─────────┘  └───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Python Scripts        │
        │  OCR │ Face │ Trim     │
        └────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB ≥ 6
- Python ≥ 3.10 (for ML scripts)
- FFmpeg installed and on your `PATH`
- Git

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/cricket-clips-dashboard.git
cd cricket-clips-dashboard
```

### 2. Install dependencies

```bash
# Backend
npm install

# Python helpers
pip install -r requirements.txt
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and fill in the values (see [Environment Variables](#-environment-variables)).

### 4. Seed initial data (first time only)

```bash
node helperfunctions/updates/update_country.js
node helperfunctions/updates/finddomestic.js
node helperfunctions/updates/findleast_matches.js
node helperfunctions/updates/addMissingFields.js
node helperfunctions/updates/populateClipSizes.js
```

### 5. Start the backend

```bash
node server.js
# or with hot reload
npx nodemon server.js
```

### 6. Start the frontend

```bash
cd client
npm install
npm run dev
```

The app will be available at:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
# ─── Server ─────────────────────────────────────────
PORT=8000
NODE_ENV=development

# ─── Database ───────────────────────────────────────
uri="mongodb://localhost:27017/cricketclips"

# ─── Auth ───────────────────────────────────────────
JWT_SECRET="your-super-secret-jwt-key"
activatekey="accountactivatekey123"
GOOGLE_CLIENT_ID="your-google-client-id"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GITHUB_REDIRECT_URI="http://localhost:5173/auth/github/callback"

# ─── Email (OTP + notifications) ────────────────────
MAILEROO_TOKEN="your-maileroo-token"
smtp_host="smtp.gmail.com"
smtp_port=465
smtp_email="you@gmail.com"
smtp_password="your-google-app-password"

# ─── Razorpay ───────────────────────────────────────
RAZOR_PAY_KEY_ID="rzp_test_xxxxxxxx"
RAZOR_PAY_KEY_SECRET="your-razorpay-secret"

# ─── Cricket Data APIs ──────────────────────────────
crickeys="your-cricapi-key"
apikeys="your-rapidapi-key"

# ─── Firebase Admin SDK ─────────────────────────────
private_key_id="firebase-key-id"
private_key="firebase-private-key"
client_email="firebase-adminsdk@project.iam.gserviceaccount.com"
client_id="firebase-client-id"
client_x509_cert_url="https://www.googleapis.com/robot/v1/metadata/x509/..."
```

⚠️ **Never commit `.env` to Git.** Add it to `.gitignore`.

---

## 📁 Project Structure

```
cricket-clips-dashboard/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI + Filter components
│   │   ├── pages/            # Dashboard, Playlists, FlaggedClips, etc.
│   │   ├── actions/          # Redux actions
│   │   ├── reducers/         # Redux reducers
│   │   ├── constants/        # API URLs, config
│   │   └── utils/            # Helpers (inferDismissals, similarity)
│   └── public/
│
├── controllers/               # Express route handlers
├── models/                    # Mongoose schemas
│   ├── clips.js
│   ├── match.js
│   ├── matchlive.js
│   ├── player.js
│   ├── team.js
│   ├── series.js
│   ├── task.js
│   ├── user.js
│   ├── playlist.js
│   └── contribution.js
│
├── routes/                    # Express routers
│   ├── clips.js
│   ├── users.js
│   ├── matches.js
│   ├── tasks.js
│   └── playlists.js
│
├── helperfunctions/           # Utility scripts
│   ├── updates/              # Data migrations
│   ├── testing/              # One-off scripts
│   └── generateLabels_match.js
│
├── utils/                     # Shared helpers
│   ├── cricket_synonyms.json
│   ├── exclusion_map.json
│   └── helpers.js
│
├── config/
│   └── db.js                 # MongoDB connection
│
├── server.js                  # Entry point
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## 🗄️ Data Models

### `Clip` — the core collection

```js
{
  over: "13.4",
  commentary: "Saim Ayub to Shan Masood, SIX, overpitches...",
  event: "SIX",
  clip: "clip_13.3_at_1396.76_149020_2.mp4",
  batsman: "Shan Masood",
  bowler: "Saim Ayub",
  duration: 20.16,
  size: 2623851,

  labels: {
    shotType: "cover_drive",
    ballType: "yorker",
    direction: "deep_cover",
    connection: "well_timed",
    wicketType: "bowled",
    lofted: false,
    powerplay: "powerplay",
    // ...18 more fields
  },

  flag: {
    isFlagged: true,
    reason: "label_conflict",
    conflictFields: ["direction"],
    reviewStatus: "pending",
    flaggedBy: ObjectId,
    flaggedAt: Date,
    fixedBy: ObjectId,
    verifiedBy: [ObjectId],
    auditStatus: "none"
  },

  matchId: "149020",
  seriesId: "11537",
  league: "PSL",
  season: "2026",
  missingClip: false,
  createdAt: Date
}
```

### Other models

| Model | Purpose |
|-------|---------|
| `Match` | Match metadata (teams, date, series, format) |
| `MatchLiveDetails` | Live scorecard + player lists per match |
| `Player` | Player profiles (name, image, country, teamIds) |
| `CricketTeam` | Team/Country mapping (name, type, flag) |
| `Series` | Series metadata |
| `Task` | Pipeline tasks for each match |
| `User` | Users with role, reputation, banState |
| `Playlist` | Clip collections (public/private) |
| `Contribution` | Audit log for every fix/flag/verify |

---

## 🌐 API Endpoints

### Clips

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/clips/allclips` | Paginated, filterable clip list |
| `GET` | `/clips/all_clips` | Alternative list endpoint |
| `GET` | `/clips/getclip/:id` | Single clip |
| `PUT` | `/clips/update-clip/:id` | Update clip (role-aware) |
| `DELETE` | `/clips/delete-clip/:id` | Delete clip (admin) |
| `POST` | `/clips/bulk-update` | Bulk flag/status update (admin) |
| `POST` | `/clips/report` | Report a clip with reason |
| `GET` | `/clips/flaggers` | Grouped flag stats by user |
| `POST` | `/clips/playlists/create` | Create playlist |
| `PUT` | `/clips/playlists/update/:id` | Update playlist |
| `DELETE` | `/clips/playlists/delete/:id` | Delete playlist |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/users/logine` | Email/password login |
| `POST` | `/users/register` | Register new user |
| `POST` | `/users/otp` | Verify OTP |
| `POST` | `/users/googlelogin` | Google login |
| `GET` | `/users/githublogin` | GitHub OAuth callback |
| `POST` | `/users/ban/:userId` | Ban user (admin) |
| `POST` | `/users/unban/:userId` | Unban user (admin) |

### Matches

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/matches` | List matches with filters |
| `GET` | `/matches/:id` | Single match |
| `GET` | `/api/match/series/all` | All series |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tasks/alltasks` | Paginated task list |
| `POST` | `/tasks/create` | Create new task |
| `PUT` | `/tasks/update/:id` | Update task |
| `GET` | `/tasks/startPipeline` | Run pipeline |

---

## 🔑 Role-Based Access

| Action | User | Crowd | Freelancer | Admin |
|--------|:----:|:-----:|:----------:|:-----:|
| View clips | ✅ | ✅ | ✅ | ✅ |
| Search / filter | ✅ | ✅ | ✅ | ✅ |
| Download clips | ✅ | ✅ | ✅ | ✅ |
| Add to playlist | ✅ | ✅ | ✅ | ✅ |
| Report clip | ✅ | ✅ | ✅ | ✅ |
| Fix clip | ❌ | ✅ | ✅ | ✅ |
| Verify fix | ❌ | ✅ | ✅ | ✅ |
| Edit flag reason | ❌ | ❌ | ❌ | ✅ |
| Bulk update | ❌ | ❌ | ❌ | ✅ |
| Ban user | ❌ | ❌ | ❌ | ✅ |
| Distribute rewards | ❌ | ❌ | ❌ | ✅ |

---

## 🚩 Moderation & Flag System

### Flow

```
User flags clip
   ↓
Reason stored in clip.flag
   ↓
Appears in /flaggers aggregation
   ↓
Admin reviews on Flag Moderation page
   ├─ Accept flag  → reviewStatus: "fixed"
   └─ Dismiss flag → reviewStatus: "dismissed"
          ↓
     If reason was wrong
          ↓
     Admin bans user (BanConfirmModal)
          ↓
     Banned user can't flag or edit
```

### Flag reasons

| Reason | Meaning |
|--------|---------|
| `label_conflict` | Two labels disagree (see `conflictFields`) |
| `video_mismatch` | Video content ≠ metadata |
| `half_clip` | Clip is cut off |
| `multiple_clips` | Two events in one clip |
| `wrong_player` | Wrong batsman/bowler |
| `wrong_event` | Not the event it claims to be |
| `bad_quality` | Unwatchable |
| `duplicate` | Duplicate of another clip |
| `manual` | Needs human review |
| `other` | Anything else |

---

## ⚙️ Scripts & Pipelines

### Data pipelines

| Script | Purpose |
|--------|---------|
| `update_country.js` | Populate country IDs for players |
| `finddomestic.js` | Assign countries based on domestic series |
| `findleast_matches.js` | Auto-assign country by most-frequent team |
| `insert_excercise.js` | Insert clips from OCR output |
| `populateClipSizes.js` | Add file size to every clip |
| `generateLabels_match.js` | Auto-generate labels from commentary |

### Python helpers

| Script | Purpose |
|--------|---------|
| `rembg.py` | Remove image backgrounds |
| `face_recognition.py` | Detect and cluster faces |
| `easyocr.py` | Read OCR text from frames |
| `whisper.py` | Transcribe commentary audio |

### Run a pipeline for a match

```bash
node helperfunctions/updates/insertClips.js <matchId>
```

---

## 🚀 Performance Notes

### Indexes you should have

```js
// Clips
clipSchema.index({ matchId: 1, over: 1 });
clipSchema.index({ league: 1, season: 1 });
clipSchema.index({ event: 1 });
clipSchema.index({ "flag.isFlagged": 1, "flag.reviewStatus": 1 });
clipSchema.index({ "flag.flaggedBy": 1 });
clipSchema.index({ batsman: 1 });
clipSchema.index({ bowler: 1 });

// MatchLiveDetails
matchLiveSchema.index({ matchId: 1 });
matchLiveSchema.index({ seriesId: 1 });

// Users
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, "banState.banned": 1 });
```

### Query tips

- Use `$match` **first** in aggregations to leverage indexes
- Prefer `.lean()` for read-only queries
- Use `bulkWrite` for batch updates, not loops of `updateOne`
- Avoid regex starting with `^` unless anchored (`/^foo/` can use an index)

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -m "Add my feature"`)
4. Push to branch (`git push origin feature/my-feature`)
5. Open a Pull Request

Please follow the existing code style and add tests for new features.

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## 📧 Contact

- **Project maintainer**: [Your Name](mailto:you@example.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/cricket-clips-dashboard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/cricket-clips-dashboard/discussions)

---

<p align="center">
  Made with 🏏 for the cricket community
</p>

https://github.com/user-attachments/assets/98b74730-6ecf-4994-8d62-f9dcd4470124


This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
