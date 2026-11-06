# Cloudora – Modern Cloud Storage & Media Management Platform

Cloudora is a high-performance cloud storage and digital media management platform inspired by Dropbox, Google Drive, and Cloudflare's developer-first aesthetic.

This initial foundation delivers a **complete, responsive frontend application** and a **dedicated Node.js/Express authentication backend** powered by JSON Web Tokens (JWT) and Bcrypt password hashing.

---

## ⚡ Architectural Scope & Boundaries

In accordance with strict project scope boundaries:
- **Completed**:
  1. Complete frontend application (React 19, TypeScript, Tailwind CSS, Lucide icons, Dark/Light mode).
  2. Separate Node.js backend (Express.js, TypeScript).
  3. User registration with input validation and duplicate detection.
  4. User login with password verification.
  5. Stateless JWT authentication (`Authorization: Bearer <token>`).
  6. 10-round salt Bcrypt password hashing.
  7. Authentication middleware (`authenticate`).
  8. Basic authorization middleware (`authorizeRoles`, `authorizeUserAccess`).
  9. Client-side protected route boundaries (`ProtectedRoute`, `PublicRoute`).
  10. User profile endpoint (`GET /api/auth/me`).
  11. End-to-end Axios client integration with token persistence.
- **Strictly Deferred to Future Engineering Phases (by User)**:
  - Database schema engineering (PostgreSQL, Prisma ORM, migrations, indexing, connection pooling).
  - Object storage engines (MinIO, AWS S3).
  - Message brokers and background queues (Kafka, Redpanda, BullMQ).
  - Media processing pipelines (FFmpeg, Sharp).
  - In-memory caching and distributed rate-limiting (Redis).
  - Infrastructure and containerization (Docker, Kubernetes, Nginx, CI/CD, Prometheus, Grafana).

---

## 📁 Project Structure

```text
Cloudora/
│
├── client/
│   ├── public/
│   │   └── cloudora-icon.svg
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── CloudoraLogo.tsx
│   │   │   │   ├── FileTypeIcon.tsx
│   │   │   │   └── ThemeToggle.tsx
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── TopNavbar.tsx
│   │   │   └── ui/
│   │   │       ├── Badge.tsx
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       └── Modal.tsx
│   │   ├── pages/
│   │   │   ├── Landing/
│   │   │   │   └── LandingPage.tsx
│   │   │   ├── Auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   ├── Dashboard/
│   │   │   │   └── DashboardPage.tsx
│   │   │   ├── Files/
│   │   │   │   └── FilesPage.tsx
│   │   │   ├── Shared/
│   │   │   │   └── SharedPage.tsx
│   │   │   ├── Media/
│   │   │   │   └── MediaPage.tsx
│   │   │   ├── Recent/
│   │   │   │   └── RecentPage.tsx
│   │   │   ├── Starred/
│   │   │   │   └── StarredPage.tsx
│   │   │   ├── Trash/
│   │   │   │   └── TrashPage.tsx
│   │   │   └── Settings/
│   │   │       └── SettingsPage.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useTheme.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── auth.service.ts
│   │   ├── routes/
│   │   │   ├── AppRoutes.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── PublicRoute.tsx
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   └── storage.types.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   └── mockData.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── routes/
│   │   │   └── auth.routes.ts
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── types/
│   │   │   └── user.types.ts
│   │   ├── utils/
│   │   │   ├── errors.ts
│   │   │   └── fileDb.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── data/
│   │   └── users.json
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## 🛠️ Technology Stack

### Frontend (`client/`)
- **React 19** with **TypeScript**
- **Vite** (Next-generation lightning-fast bundler)
- **Tailwind CSS v3.4** (Custom Cloudflare orange palette, hairline borders, dotted grid canvas)
- **React Router DOM v7** (Client routing & navigation guards)
- **Lucide React** (Clean, consistent iconography)
- **Axios** (Configured with request and response interceptors)
- **Urbanist** Google Font typography

### Backend (`server/`)
- **Node.js** & **Express.js** with **TypeScript**
- **bcrypt** (Cost factor 10 password hashing)
- **jsonwebtoken** (RFC 7519 signed JWT generation & verification)
- **cors** (Strict origin validation)
- **dotenv** (Configuration loading)
- **Atomic File JSON Storage** (`server/data/users.json`)

---

## 🔑 Authentication API Reference

Base URL: `http://localhost:5000/api`

### 1. Register User
`POST /auth/register`

- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password@123"
  }
  ```
- **Validation**:
  - `name`: Min 2 characters.
  - `email`: Valid RFC email syntax; duplicates rejected with `409 Conflict`.
  - `password`: Min 8 characters; hashed with bcrypt before storing.
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Account registered successfully.",
    "data": {
      "user": {
        "id": "76495111-2df8-43bb-a309-fa9869612cbb",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "USER",
        "createdAt": "2026-11-06T06:55:31.019Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 2. Login User
`POST /auth/login`

- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password@123"
  }
  ```
- **Security**: Compares password against bcrypt hash. Returns generic `401 Unauthorized` on mismatch or missing user to prevent account enumeration.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "user": {
        "id": "76495111-2df8-43bb-a309-fa9869612cbb",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "USER",
        "createdAt": "2026-11-06T06:55:31.019Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 3. Get Current User Profile
`GET /auth/me`

- **Headers**:
  ```text
  Authorization: Bearer <token>
  ```
- **Security**: Protected by `authenticate` middleware. Rejects expired or missing tokens with `401`. Never returns `passwordHash`.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "76495111-2df8-43bb-a309-fa9869612cbb",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "USER",
        "createdAt": "2026-11-06T06:55:31.019Z"
      }
    }
  }
  ```

### 4. Logout User
`POST /auth/logout`

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User logged out successfully.",
    "meta": {
      "notice": "Stateless JWT cleared on client. Server-side token blacklisting will be integrated in future phases."
    }
  }
  ```

---

## ⚠️ Current Limitations & Architectural Notes

1. **Temporary JSON Persistence (`server/data/users.json`)**:
   - The file-based JSON database is strictly a temporary storage mechanism for development and testing.
   - It is **not production-grade** and lacks ACID transactions, row-level locks, and horizontal replication.
   - It will be superseded by PostgreSQL and Prisma in the subsequent database engineering phase.
2. **Stateless JWTs**:
   - In this initial phase, JWT revocation relies on client-side token deletion from `localStorage`.
   - Redis-backed token denylisting, refresh tokens, and sliding sessions will be integrated in future distributed architecture stages.
3. **Dashboard Mock Data**:
   - Files, folders, and storage metrics in the dashboard are realistic UI demonstrations and are not yet backed by object storage (MinIO/S3).

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+` or `v20+` or `v22+`
- npm `v9+` or `v10+` or `v11+`

---

### Backend Setup & Execution

1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:5000`.

---

### Frontend Setup & Execution

1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`.

---

## 🧪 Default Test Account

A pre-seeded user is available in `server/data/users.json`:
- **Email**: `elena@cloudora.io`
- **Password**: `Password@123`

You can also register any new account on the `/register` page.

