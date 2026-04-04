# ScholarAid Docs

Developer documentation for the ScholarAid platform - an AI-powered scholarship management and application tool.

## Structure

| Folder | What it covers |
|---|---|
| [auth/](auth/) | JWT authentication - register, login, logout, profile, password change |
| [scholarships/](scholarships/) | Scholarship listing, filtering, and detail pages |
| [ai-review/](ai-review/) | AI prep guides, essay review, and AI chat |
| [admin/](admin/) | Admin dashboard APIs, support inbox, broadcasts, and realtime messaging |
| [core/](core/) | Newsletter subscriptions and contact form |
| [frontend/](frontend/) | Next.js app architecture, services layer, and routing |
| [deployment/](deployment/) | Environment variables, database setup, and production config |
| [project/](project/) | Project notes, implementation TODOs, and planning docs |

## Quick orientation

- **Backend**: Django 5 REST API, mounted at `/api/v1/`. Source in `backend/`.
- **Admin tools**: Admin dashboard APIs live in `backend/admin_api/`; support chat lives in `backend/messaging/`.
- **Frontend**: Next.js 16 App Router. Source in `frontend/src/`.
- **Auth**: JWT via `djangorestframework-simplejwt`. Tokens stored in `localStorage`.
- **Realtime**: Support messaging uses WebSockets for live updates and REST endpoints for history/unread reconciliation.
- **Database**: SQLite in development, PostgreSQL-ready in production (via `DATABASE_URL`).
