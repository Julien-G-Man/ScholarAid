# ScholarAid

> AI-powered scholarship discovery, application prep, and support platform.
> ScholarAid combines a Django API, a Next.js frontend, AI review workflows, and live support messaging into one scholarship experience for applicants and admins.

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/Python-3.11-blue.svg)
![Django](https://img.shields.io/badge/Django-5.x-darkgreen.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)

## What ScholarAid Does

ScholarAid helps students move from scholarship discovery to application improvement in one place.

### For applicants

- Browse and filter scholarship opportunities
- View scholarship requirements, prompts, deadlines, and links
- Create an account and manage a profile
- Use the AI Prep workspace for scholarship-specific guidance
- Submit essays for AI review and scoring
- Ask follow-up questions in the AI chat
- Track review activity from a personal dashboard
- Contact support through a floating in-app chat widget

### For admins

- View platform and AI activity stats
- Monitor users and their scholarship-prep progress
- Inspect user AI review sessions and chat history
- Manage a live support inbox
- Send broadcast announcements to connected users
- Track contact-form submissions separately from live support chat

## Core Features

- Scholarship browsing with featured and detail views
- JWT authentication with profile management
- AI preparation guides per scholarship
- AI essay review sessions with statuses and feedback
- AI follow-up chat tied to review sessions
- Personalized user dashboard with review metrics
- Admin dashboard with user, AI, and messaging insights
- Realtime support messaging over WebSockets
- Built-in health check and OpenAPI schema endpoints

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Django 5.x, Django REST Framework |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Bootstrap 5, Bootstrap Icons |
| Auth | JWT via `djangorestframework-simplejwt` |
| HTTP Client | Axios |
| Realtime | Django Channels, WebSockets |
| Database | SQLite (dev), PostgreSQL (prod) on (Neon DB)[neon.tech] via `DATABASE_URL` |
| CORS | `django-cors-headers` |

## Architecture Overview

```text
ScholarPro/
|-- backend/                 # Django REST API and realtime services
|   |-- ai_review/           # AI prep guides, review sessions, and AI chat
|   |-- admin_api/           # Admin dashboard and admin-facing APIs
|   |-- config/              # Django settings, root URLs, schema, health route
|   |-- core/                # Scholarships, newsletter, and contact form
|   |-- messaging/           # Support messaging REST + WebSocket layer
|   |-- users/               # Registration, login, profile, password change
|   `-- requirements.txt
|-- frontend/                # Next.js App Router frontend
|   `-- src/
|       |-- app/             # Pages like /scholarships, /ai-prep, /dashboard, /admin
|       |-- components/      # Navbar, footer, messaging widget, shared UI
|       |-- context/         # AuthContext and MessagingContext
|       |-- lib/             # Server-side data fetching helpers
|       |-- services/        # Axios API clients
|       `-- types/           # Shared TypeScript payload types
|-- docs/                    # Detailed project documentation
`-- README.md
```

## Local Setup

### 1. Start the backend

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
# source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend URLs:

- App root: `http://localhost:8000`
- API base: `http://localhost:8000/api/v1/`
- Health check: `http://localhost:8000/api/v1/health/`
- Schema: `http://localhost:8000/api/schema/`

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

- App: `http://localhost:3000`

## Environment Variables

### Backend

Create `backend/.env` with values similar to:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
FRONTEND_URL=http://localhost:3000
```

Common production-facing variables also supported by the backend include:

```env
DATABASE_URL=postgres://...
CSRF_TRUSTED_ORIGINS=https://your-frontend-domain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### Frontend

Create `frontend/.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

`NEXT_PUBLIC_API_URL` is used by:

- the Axios client
- server-side fetch helpers
- the derived WebSocket base URL in `MessagingContext`

## Main User Flows

### Applicant flow

1. Register or log in
2. Browse scholarships or jump into `AI Prep`
3. Open a scholarship-specific AI prep page
4. Read preparation guides and submit an essay
5. Review AI feedback and continue the AI chat
6. Track progress from `/dashboard`
7. Message support from the floating chat widget if needed

### Admin flow

1. Log in with a staff or superuser account
2. Open `/admin`
3. Review platform stats, AI activity, and user metrics
4. Open a user detail page for session history and direct support chat
5. Monitor unread inbox counts and send broadcasts when needed

## Routing Overview

### Frontend routes

| Route | Purpose |
| --- | --- |
| `/` | Marketing-style homepage |
| `/scholarships` | Scholarship list |
| `/scholarships/[id]` | Scholarship detail |
| `/contact` | Public contact form |
| `/login` | User sign-in |
| `/register` | User registration |
| `/profile` | Authenticated user profile |
| `/dashboard` | Authenticated user dashboard |
| `/ai-prep` | AI prep landing page |
| `/ai-prep/[id]` | Scholarship-specific AI prep workspace |
| `/ai-prep/reviews` | User review session history |
| `/admin` | Staff/superuser dashboard |
| `/admin/users/[id]` | Staff/superuser user detail and message thread |

### Backend routes

The Django backend mounts versioned endpoints under `/api/v1/` and also exposes schema and health utilities.

Utility endpoints:

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/health/` | Health check endpoint |
| `GET /api/schema/` | DRF OpenAPI schema |
| `GET /api/docs/` | Redirect to the schema view |

Application endpoints:

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/scholarships/` | List scholarships |
| `GET /api/v1/scholarships/featured/` | List featured scholarships |
| `GET /api/v1/scholarships/<id>/` | Get scholarship details |
| `POST /api/v1/newsletter/subscribe/` | Subscribe to the newsletter |
| `POST /api/v1/contact/` | Submit a contact form |
| `GET /api/v1/ai-prep/<scholarship_id>/` | Get AI preparation guides for a scholarship |
| `GET /api/v1/ai-prep/reviews/` | List the current user's AI review sessions |
| `POST /api/v1/ai-review/` | Submit an essay or file for AI review |
| `GET /api/v1/ai-review/<session_id>/` | Get one AI review session |
| `POST /api/v1/ai-review/<session_id>/chat/` | Send an AI follow-up question |
| `GET /api/v1/ai-review/<session_id>/chat/` | Fetch AI chat history |
| `POST /api/v1/auth/register/` | Register a new user |
| `POST /api/v1/auth/login/` | Obtain access and refresh tokens |
| `POST /api/v1/auth/logout/` | Log out and blacklist refresh token |
| `POST /api/v1/auth/token/refresh/` | Refresh an access token |
| `GET /api/v1/auth/profile/` | Retrieve the current user's profile |
| `PATCH /api/v1/auth/profile/` | Update the current user's profile |
| `POST /api/v1/auth/change-password/` | Change the current user's password |
| `GET /api/v1/messages/` | Get the current user's support thread |
| `GET /api/v1/messages/unread-count/` | Get the current user's unread support count |
| `GET /api/v1/admin/stats/` | Get admin dashboard metrics |
| `GET /api/v1/admin/users/` | List users with activity summaries |
| `GET /api/v1/admin/users/<user_id>/` | Get one user's admin detail view |
| `GET /api/v1/admin/messages/` | List admin inbox conversations |
| `GET /api/v1/admin/messages/unread-count/` | Get admin unread support count |
| `GET /api/v1/admin/messages/<user_id>/` | Get one admin conversation thread |
| `DELETE /api/v1/admin/messages/delete/<message_id>/` | Delete a message from admin |

## Messaging Notes

ScholarAid currently has two separate communication channels:

- `POST /api/v1/contact/` for public contact-form submissions
- the `messaging` app for authenticated live support chat

Important behavior:

- Admin unread counts come from the messaging system, not `ContactMessage`
- Contact-form totals still appear separately in admin stats
- The frontend seeds unread counts from REST, then keeps them live over WebSockets
- The WebSocket base URL is derived from `NEXT_PUBLIC_API_URL`

## Development Notes

- Both `frontend/src/services/axiosInstance.ts` and `frontend/src/lib/serverApi.ts` default to `http://localhost:8000/api/v1`.
- If the API version changes later, update the Django route prefix and `NEXT_PUBLIC_API_URL` together.
- The backend root redirects to the schema view.
- More detailed documentation lives in [docs/README.md](docs/README.md).

## Documentation Map

- [Project docs index](docs/README.md)
- [Frontend architecture](docs/frontend/README.md)
- [Admin and messaging](docs/admin/README.md)
- [Core app: scholarships, newsletter, contact](docs/core/README.md)
- [AI review and prep](docs/ai-review/README.md)
- [Deployment and configuration](docs/deployment/README.md)
- [Authentication](docs/auth/README.md)
