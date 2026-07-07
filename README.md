# Skills Platform

A full-stack course management and learning platform with a public course website, an admin dashboard, and an Express/MongoDB REST API.

## Overview

Skills Platform is built for publishing courses, managing course content, tracking bookings, and allowing learners to browse, purchase, view, and rate courses. The repository is organized as three separate apps:

- `frontend`: learner-facing React/Vite website
- `admin`: admin React/Vite dashboard for course and booking management
- `backend`: Express API connected to MongoDB, Cloudinary, Clerk, and Stripe

## Features

- Public website pages for Home, About, Contact, Faculty, Courses, course details, and My Courses
- Clerk-powered authentication integration in the React apps and backend middleware
- Protected learner course detail and enrolled-course routes
- Public course listing with course search and top/regular course handling
- Course rating UI and backend rating endpoints
- Booking/enrollment flow with free-course confirmation and Stripe checkout support for paid courses
- Learner "My Courses" page based on confirmed bookings
- Admin dashboard route
- Admin course creation with image upload, lectures, chapters, pricing, duration totals, and course type
- Admin List Course table with data fetching, loading/empty states, title search, 10/20 row pagination, edit modal, delete action, and publish/draft toggle
- Admin booking list with search, loading, error, and empty states
- Backend course CRUD, public course queries, rating, booking, booking stats, payment confirmation, and user booking endpoints

## Tech Stack

### Frontend App

- React `^19.2.0`
- React DOM `^19.2.0`
- Vite `^7.2.4`
- React Router DOM `^7.11.0`
- Clerk React `^5.59.2`
- Tailwind CSS `^4.1.18` via `@tailwindcss/vite`
- Axios `^1.13.2`
- Lucide React `^0.562.0`
- React Hot Toast `^2.6.0`
- React Toastify `^11.0.5`
- DotLottie React `^0.17.12`

### Admin App

- React `^19.2.0`
- React DOM `^19.2.0`
- Vite `^7.2.4`
- React Router DOM `^7.12.0`
- Clerk React `^5.59.3`
- Tailwind CSS `^4.1.18` via `@tailwindcss/vite`
- Axios `^1.13.2`
- Lucide React `^0.562.0`
- React Hot Toast `^2.6.0`
- React Toastify `^11.0.5`

### Backend

- Node.js with Express `^5.2.1`
- MongoDB driver `^7.0.0`
- Mongoose `^9.1.3`
- Clerk Express `^1.7.62` and Clerk Backend `^2.29.2`
- Cloudinary `^2.5.1`
- Multer `^2.0.2`
- Stripe `^20.1.2`
- Dotenv `^17.2.3`
- CORS `^2.8.5`
- Nodemon `^3.1.11`

## Project Structure

```text
.
├── admin/                         # Admin React/Vite app
│   ├── src/api/courses.js          # Admin course API helper functions
│   ├── src/components/             # Admin UI components
│   │   ├── AddPage.jsx             # Create course form
│   │   ├── BookingsPage.jsx        # Admin booking list/search
│   │   ├── DashboardPage.jsx       # Admin dashboard
│   │   ├── Navbar.jsx              # Admin navigation
│   │   └── course/                 # List Course table/edit modal feature
│   ├── src/pages/                  # Route wrappers for admin pages
│   ├── src/assets/                 # Admin images and style constants
│   └── vite.config.js              # Vite + React + Tailwind plugin config
├── frontend/                       # Learner-facing React/Vite app
│   ├── src/components/             # Public site and learner components
│   ├── src/pages/                  # Route-level pages
│   ├── src/assets/                 # Images, videos, and dummy data/style files
│   ├── VerifyPaymentPage.jsx       # Booking success/cancel verification page
│   └── vite.config.js              # Vite + React + Tailwind plugin config
├── backend/                        # Express REST API
│   ├── config/                     # MongoDB and Cloudinary configuration
│   ├── controllers/                # Course and booking controller logic
│   ├── models/                     # Mongoose models
│   ├── routes/                     # Express routers
│   ├── uploads/                    # Local uploaded course image files
│   └── server.js                   # API server entry point
├── LICENSE                         # MIT license
└── README.md                       # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+ recommended for Vite 7
- npm, using the checked-in `package-lock.json` files
- MongoDB connection string
- Clerk application keys
- Cloudinary account for course image upload
- Stripe secret key if paid checkout should work

### Installation

```bash
git clone <repository-url>
cd Skills-Platform

cd backend
npm install

cd ../frontend
npm install

cd ../admin
npm install
```

### Environment Variables

No `.env.example` files are currently included. Create local `.env` files with the keys below and do not commit real secret values.

`backend/.env`

```env
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
STRIPE_SECRET_KEY=
MONGO_URI=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FRONTEND_URL=
PORT=4000
```

`frontend/.env`

```env
VITE_CLERK_PUBLISHABLE_KEY=
```

`admin/.env`

```env
VITE_CLERK_PUBLISHABLE_KEY=
VITE_API_BASE_URL=
```

`VITE_API_BASE_URL` is used by the admin List Course API helper. Several existing frontend/admin components still use the deployed API URL directly in code.

### Running Locally

Start the backend:

```bash
cd backend
npm run dev
```

The backend defaults to `http://localhost:4000`.

Start the learner frontend:

```bash
cd frontend
npm run dev
```

Vite usually serves this app at `http://localhost:5173`.

Start the admin app:

```bash
cd admin
npm run dev
```

If the frontend is already using port `5173`, Vite will usually choose the next available port such as `5174`.

### Production Build

```bash
cd frontend
npm run build

cd ../admin
npm run build
```

The backend is started in production with:

```bash
cd backend
npm start
```

## API / Backend

The backend mounts the same course router at both `/api/course` and `/api/courses`.

### Course Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/course/public` | Get public courses, with optional `home`, `type`, and `limit` query parameters |
| `GET` | `/api/course` | Get all courses for admin/dashboard use |
| `GET` | `/api/course/:id` | Get one course by ID |
| `POST` | `/api/course` | Create a course; accepts multipart image upload under `image` |
| `PUT` | `/api/course/:id` | Update course fields such as title/name, teacher, overview, category, image, price, and status |
| `PATCH` | `/api/course/:id/status` | Update publish/draft status |
| `DELETE` | `/api/course/:id` | Delete a course and attempt Cloudinary image cleanup |
| `POST` | `/api/course/:courseId/rate` | Submit an authenticated course rating |
| `GET` | `/api/course/:courseId/rating` | Get the authenticated user's rating for a course |

The admin List Course helper first tries `/api/courses` and falls back to `/api/course` for compatibility.

### Booking Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/booking` | Admin booking list with `search`, `status`, `limit`, and `page` query parameters |
| `GET` | `/api/booking/stats` | Dashboard booking/course stats |
| `POST` | `/api/booking/create` | Create a booking; free courses are confirmed immediately, paid courses create a Stripe checkout session |
| `GET` | `/api/booking/check` | Check whether the current Clerk user is enrolled in a course |
| `GET` | `/api/booking/confirm` | Confirm Stripe checkout payment using `session_id` |
| `GET` | `/api/booking/my` | Get bookings for the authenticated Clerk user |

## Available Scripts

### Frontend

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `vite` | Start the learner frontend dev server |
| `build` | `vite build` | Build the learner frontend for production |
| `lint` | `eslint .` | Run ESLint |
| `preview` | `vite preview` | Preview the production build locally |

### Admin

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `vite` | Start the admin dev server |
| `build` | `vite build` | Build the admin app for production |
| `lint` | `eslint .` | Run ESLint |
| `preview` | `vite preview` | Preview the production build locally |

### Backend

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `nodemon server.js` | Start the API server with automatic restarts |
| `start` | `node server.js` | Start the API server |

## Folder / Component Conventions

- React apps use functional components and hooks.
- Route wrappers live in `src/pages`; reusable UI and feature components live in `src/components`.
- Admin List Course code is grouped under `admin/src/components/course`.
- Backend code is split into `routes`, `controllers`, `models`, and `config`.
- Styling is mixed: Tailwind utility classes are used throughout, `dummyStyles.js` stores large style-class maps, and the List Course feature uses a plain CSS file.
- API calls are mostly direct `fetch` calls inside components; the newer admin List Course feature uses `admin/src/api/courses.js`.

## Known Limitations / TODO

- There are no `.env.example` files yet.
- There is no root-level workspace/package script to install, run, or build all three apps together.
- Several components hardcode the deployed API base URL instead of reading from environment variables.
- Some frontend code calls `/api/course/:id/my-rating`, while the backend route currently exposed in `courseRouter.js` is `/api/course/:courseId/rating`.
- Full admin lint currently reports pre-existing issues in older files, although the List Course feature files lint successfully.
- Authentication patterns are mixed: Clerk is configured, while one protected frontend route also checks `localStorage.getItem("token")`.

## Contributing

1. Create a focused branch, for example `feature/course-edit-modal` or `fix/booking-search`.
2. Keep changes scoped to one feature or bug fix.
3. Run the relevant app's build and lint before opening a PR.
4. Include a short PR summary, testing notes, and screenshots for UI changes.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
