# StudySync (Library / Study Room Management)

Modern full-stack Library / Study Room Management web app (Admin + Student) with QR attendance (static + dynamic), seat management, fee tracking, PDF invoices, productivity (to-dos/goals), and study analytics.

## Folder Structure

```
StudySync/
  frontend/
    index.html
    admin/
      index.html
      students.html
      seats.html
      qr.html
      payments.html
      notifications.html
    student/
      index.html
      attendance.html
      goals.html
      payments.html
      profile.html
    css/
      styles.css
    js/
      api.js
      auth.js
      charts.js
      components.js
      config.js
      storage.js
      toast.js
      pages/
        *.js
    assets/
  backend/
    app.js
    server.js
    package.json
    .env.example
    config/
      db.js
      env.js
    controllers/
      *.js
    middleware/
      *.js
    models/
      *.js
    routes/
      *.js
    scripts/
      createAdmin.js
    uploads/
```

## Database Design (MongoDB Models)

- `User` (admin/student): profile + seat/plan/fee metadata (`backend/models/User.js`)
- `Seat`: seatNumber/type/allowedShift + assigned student (`backend/models/Seat.js`)
- `Attendance`: one doc per user per dateKey, check-in/out + totalMinutes (`backend/models/Attendance.js`)
- `Payment`: one doc per user per monthKey, amount/status + invoiceNumber (`backend/models/Payment.js`)
- `Goal`: productivity tasks/goals by scope (daily/weekly/monthly) (`backend/models/Goal.js`)
- `Notification`: announcements/due reminders (in-app + email placeholder) (`backend/models/Notification.js`)

Relationships:
- `Seat.assignedTo -> User`
- `User.seatId -> Seat`
- `Attendance.user -> User`
- `Payment.user -> User`
- `Goal.user -> User`
- `Notification.user -> User` (optional; audience can be global)

## Backend API (Main Routes)

Auth:
- `POST /api/auth/register` student register
- `POST /api/auth/login`
- `GET /api/auth/me`

Admin:
- `GET /api/admin/dashboard`
- `GET /api/admin/students`
- `POST /api/admin/students`
- `PATCH /api/admin/students/:id`
- `DELETE /api/admin/students/:id`
- `POST /api/admin/students/:id/profile-image` (multipart `image`)
- `POST /api/admin/students/:id/assign-seat`
- `POST /api/admin/students/:id/unassign-seat`
- `GET /api/admin/qr/static`
- `GET /api/admin/qr/dynamic`

Attendance:
- `POST /api/attendance/mark` (static/dynamic QR payload)
- `GET /api/attendance/me/history`
- `GET /api/attendance/me/monthly`

Seats:
- `GET /api/seats`
- `POST /api/seats` (admin)
- `POST /api/seats/bulk` (admin)
- `POST /api/seats/:seatId/assign` (admin)

Payments + Invoice:
- `GET /api/payments` (admin)
- `POST /api/payments` (admin)
- `GET /api/payments/me`
- `GET /api/payments/me/due`
- `GET /api/payments/:paymentId/invoice` (streams PDF)

Goals:
- `GET /api/goals`
- `POST /api/goals`
- `PATCH /api/goals/:id`
- `DELETE /api/goals/:id`

Notifications:
- `GET /api/notifications/me`
- `POST /api/notifications` (admin)

Student summary (dashboards):
- `GET /api/users/me/summary`

Security:
- JWT required for all non-auth routes.
- Role checks via `backend/middleware/authMiddleware.js`

## Local Development (Mac) — Step By Step

### 1) Install Node.js

Recommended: install Node LTS using Homebrew:
```bash
brew install node
node -v
npm -v
```

### 2) Install MongoDB

Option A (local MongoDB):
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

Option B (MongoDB Atlas): create a free cluster and use an Atlas connection string for `MONGO_URI`.

### 3) Backend Setup

```bash
cd StudySync/backend
npm install
cp .env.example .env
```

Edit `StudySync/backend/.env` and set:
- `JWT_SECRET`
- `STATIC_QR_SECRET`
- `DYNAMIC_QR_SECRET`
- `MONGO_URI` (local or Atlas)
- `CLIENT_ORIGIN` (where your frontend runs, default `http://127.0.0.1:5500`)

Create your first admin user:
```bash
cd StudySync/backend
ADMIN_EMAIL="admin@studysync.local" ADMIN_PASSWORD="Admin@12345" ADMIN_NAME="StudySync Admin" npm run create-admin
```

Run backend:
```bash
cd StudySync/backend
npm run dev
```

Health check:
- Open `http://localhost:5000/api/health`

### 4) Frontend Setup

Use a static server (required for ES modules).

Option A (VS Code Live Server):
- Open `StudySync/` in VS Code
- Run Live Server from `StudySync/frontend/index.html` on port `5500`

Option B (Python http.server):
```bash
cd StudySync/frontend
python3 -m http.server 5500
```
Then open `http://127.0.0.1:5500`

Frontend API base URL:
- `StudySync/frontend/js/config.js` -> `CONFIG.API_BASE`

### 5) Test APIs (Optional)

Use curl:
```bash
curl http://localhost:5000/api/health
```

Or use Postman:
- Login -> copy `token`
- Set `Authorization: Bearer <token>`

## QR Attendance (How It Works)

- Static QR: admin prints a single QR from Admin → QR Setup (payload matches `STATIC_QR_SECRET`).
- Dynamic QR: admin displays a QR that refreshes every 30 seconds; backend validates the time-slice HMAC signature.
- Student scans QR in Student → Attendance:
  - First scan = check-in (creates attendance for today).
  - Second scan = check-out (computes `totalMinutes`).

## Deployment Guide (After Local Works)

### 1) MongoDB Atlas

1. Create Atlas cluster
2. Add a DB user
3. Add your deployed backend’s IP / `0.0.0.0/0` (for quick testing)
4. Copy connection string into backend `MONGO_URI`

### 2) Deploy Backend (Render or Railway)

Render (example):
1. Create a new Web Service from your repo
2. Root directory: `StudySync/backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `STATIC_QR_SECRET`
   - `DYNAMIC_QR_SECRET`
   - `DYNAMIC_QR_WINDOW_SECONDS`
   - `CLIENT_ORIGIN` (your frontend URL)
   - (Optional) SMTP vars

After deploy:
- Verify `https://<your-backend>/api/health`

### 3) Deploy Frontend (Netlify or Vercel)

Netlify:
1. New site from Git
2. Base directory: `StudySync/frontend`
3. Build command: (none)
4. Publish directory: `StudySync/frontend`
5. Update `StudySync/frontend/js/config.js`:
   - `API_BASE` => your deployed backend `/api` URL

Vercel:
1. New project
2. Framework preset: “Other”
3. Root directory: `StudySync/frontend`
4. No build step
5. Update `StudySync/frontend/js/config.js` as above

### 4) Common Deployment Troubleshooting

- CORS errors: ensure backend `CLIENT_ORIGIN` matches your deployed frontend URL exactly.
- 401 errors: token expired or missing; login again.
- Atlas connection errors: confirm DB user/password and IP allow-list.

## Project Name Ideas

If you want alternatives to “StudySync”:
- `SeatWise`
- `StudyDeck`
- `Roomly`
- `FocusHub`

