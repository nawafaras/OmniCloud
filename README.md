# OmniCloud

OmniCloud is a full-stack cloud drive aggregation platform that presents multiple storage providers through a single, consistent workspace. The application combines a Vue-based client with an Express API and provider adapter layer, enabling users to browse, upload, download, and manage files across connected cloud accounts from one interface.

## ✨ Overview

OmniCloud is designed around a unified file experience:

- Connect supported cloud storage accounts through provider-specific authentication
- Browse provider content through a normalized virtual file tree
- Manage files and folders through a single UI
- Stream uploads through the API with real-time progress updates
- Maintain a local metadata mirror for responsive navigation and synchronization

## 🚀 Core capabilities

### 🗂️ Unified storage interface
- Consolidated file browsing across connected providers
- `Home` and `My Drive` style navigation
- Normalized virtual paths for cross-provider access patterns

### 📁 File and folder operations
- Create folders
- Rename files and folders
- Delete files and folders
- Download provider files
- View file metadata and details

### ⬆️ Upload workflow
- File upload from the browser
- Folder upload support
- Drag-and-drop upload interactions
- WebSocket-based progress reporting

### 🔗 Account and quota management
- Real provider account connections
- Local persistence of linked account metadata
- Per-account storage usage tracking

### ⚙️ Operational architecture
- Shared adapter model for provider integrations
- SQLite-backed metadata mirror
- Scheduled synchronization jobs
- Secure local persistence for provider credentials and tokens

## ☁️ Supported providers

| Provider | Integration |
| --- | --- |
| Google Drive | OAuth + Drive API |
| OneDrive | Microsoft Graph |
| Dropbox | OAuth + Dropbox file APIs |
| MEGA | Account login + file APIs |
| S3-compatible | Adapter foundation |

## 🏗️ Architecture

```text
OmniCloud/
├─ frontend/         # Vue 3 application
├─ backend/          # Express API, adapters, sync, SQLite
├─ docs/             # Supporting documentation
├─ package.json      # Workspace scripts
├─ LICENSE
└─ README.md
```

### 🎨 Frontend
- Vue 3
- Vite
- Pinia
- Vue Router
- Tailwind CSS v4
- `@tabler/icons-vue`

### 🧩 Backend
- Node.js
- Express
- WebSocket via `ws`
- SQLite via `better-sqlite3`
- `node-cron` for scheduled synchronization
- Provider SDKs and API integrations

## 🔄 How it works

The frontend communicates exclusively with the API layer. The API delegates provider-specific behavior to adapter implementations, mirrors file metadata into SQLite, and coordinates synchronization and upload progress events.

At a high level:

1. the client requests file or account operations through the API
2. the API selects the appropriate provider adapter
3. provider responses are normalized into the OmniCloud data model
4. metadata is stored locally for fast navigation and sync workflows
5. upload progress is published to the client over WebSocket connections

## 📋 Requirements

Before running OmniCloud locally, ensure the following are installed and available:

- Node.js 20 or newer
- npm
- provider credentials for any cloud integrations you intend to use

For best tooling compatibility, use an LTS Node.js release.

## 🛠️ Getting started

### 1️⃣ Install dependencies

From the repository root:

- `npm install`

### 2️⃣ Configure environment variables

Create a local environment file for the API:

- copy `backend/.env.example` to `backend/.env`

Example values:

```env
PORT=8787
CORS_ORIGIN=http://localhost:5173
SYNC_INTERVAL_MINUTES=5
OMNICLOUD_SECRET_HALF=replace-this-with-random-half-key
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8787/api/accounts/google/callback
ONEDRIVE_CLIENT_ID=
ONEDRIVE_CLIENT_SECRET=
ONEDRIVE_TENANT_ID=common
ONEDRIVE_REDIRECT_URI=http://localhost:8787/api/accounts/onedrive/callback
DROPBOX_CLIENT_ID=
DROPBOX_CLIENT_SECRET=
DROPBOX_REDIRECT_URI=http://localhost:8787/api/accounts/dropbox/callback
```

### 3️⃣ Configure provider credentials

Provider setup instructions are documented in:

- [`docs/provider-setup.md`](docs/provider-setup.md)

## 💻 Development

Run the frontend and backend together from the repository root:

- `npm run dev`

Default local endpoints:

- Frontend: `http://localhost:5173`
- API: `http://localhost:8787`

### 📌 Available scripts

Root scripts exposed by `package.json`:

| Script | Description |
| --- | --- |
| `npm run dev` | Run frontend and backend in parallel |
| `npm run build` | Build the frontend application |
| `npm run dev:web` | Run only the frontend dev server |
| `npm run dev:api` | Run only the backend API server |
| `npm start` | Start the backend server |

## 🔌 API surface

Representative endpoints include:

### ❤️ Health
- `GET /api/health`

### 👤 Accounts
- `GET /api/accounts`
- provider connect and callback routes under `/api/accounts/...`

### 📄 Files
- `GET /api/files?path=/`
- `GET /api/files/:id`
- `GET /api/files/:id/download`
- `PATCH /api/files/:id/rename`
- `DELETE /api/files/:id`
- `POST /api/files/folders`

### 📤 Uploads
- `POST /api/uploads/initiate`
- `POST /api/uploads/:uploadId/stream`
- `WS /ws/uploads?uploadId=...`

## 🔒 Data and security

- Local metadata is stored in `backend/omnicloud.db`
- Environment files and local database files should not be committed
- OAuth credentials, refresh tokens, and provider credentials must be treated as sensitive material
- Provider application consent and callback settings should be reviewed before using production credentials

## 📄 License

This project is licensed under the [MIT License](LICENSE).
