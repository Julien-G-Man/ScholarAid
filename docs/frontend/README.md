# Frontend Architecture

The frontend is a Next.js 16 application using the App Router. It is written in TypeScript and styled with Bootstrap 5 and Bootstrap Icons.

Additional frontend feature docs:
- [AI Prep](ai-prep.md)
- [Admin & Messaging](../admin/README.md)

---

## Directory layout

```text
frontend/src/
|-- app/                           # App Router pages and layouts
|   |-- layout.tsx                 # Root layout
|   |-- page.tsx                   # Homepage (/)
|   |-- about/page.tsx
|   |-- contact/page.tsx
|   |-- ai-prep/page.tsx           # Scholarship AI prep landing page
|   |-- ai-prep/reviews/page.tsx   # User AI review session history
|   |-- admin/page.tsx             # Staff/superuser dashboard
|   |-- admin/users/[id]/page.tsx  # Staff/superuser user detail + inbox thread
|   |-- dashboard/page.tsx         # Auth-gated user dashboard
|   |-- profile/page.tsx           # Auth-gated profile page
|   |-- login/page.tsx
|   |-- register/page.tsx
|   `-- scholarships/
|       |-- page.tsx               # Scholarship list
|       `-- [id]/page.tsx          # Scholarship detail
|-- components/                    # Shared UI including support chat widget
|-- context/                       # Auth + messaging providers
|-- lib/                           # Server-side data fetching helpers
|-- services/                      # Client-side API services
`-- types/                         # Shared TypeScript types
```

---

## Root layout (`app/layout.tsx`)

Every page is wrapped by:
- `<Providers>` - mounts `AuthProvider` and `MessagingProvider`.
- `<BootstrapClient>` - dynamically imports Bootstrap JS on the client to enable dropdowns, collapses, etc.
- `<Navbar>` - global navigation bar, auth-aware.
- `<Footer>` - includes the `NewsletterForm`.

`Providers` also renders `MessagingWidget`, the floating support chat available to authenticated non-admin users.

---

## Services layer

Two separate modules handle API communication from the client side.

### `axiosInstance` (`services/axiosInstance.ts`)

A configured Axios instance shared by `api.ts` and `authService.ts`.

- Base URL: `NEXT_PUBLIC_API_URL` environment variable, defaulting to `http://localhost:8000/api/v1`.
- Request interceptor: Attaches the stored `access_token` as a Bearer token on every request.
- Response interceptor: On `401`, silently refreshes the token and retries the original request. On refresh failure, clears localStorage and lets the error propagate.

### `api.ts` (`services/api.ts`)

General-purpose client for scholarships, AI prep, admin, and messaging endpoints.

| Method | Endpoint |
|---|---|
| `getScholarships(params?)` | `GET /scholarships/` |
| `getFeaturedScholarships()` | `GET /scholarships/featured/` |
| `getScholarship(id)` | `GET /scholarships/<id>/` |
| `subscribeNewsletter(email)` | `POST /newsletter/subscribe/` |
| `submitContact(data)` | `POST /contact/` |
| `getAIPreparationGuides(scholarshipId)` | `GET /ai-prep/<id>/` |
| `getAIReviewSessions()` | `GET /ai-prep/reviews/` |
| `submitAIReview(data)` | `POST /ai-review/` |
| `getAIReviewSession(sessionId)` | `GET /ai-review/<id>/` |
| `sendAIChatMessage(sessionId, message)` | `POST /ai-review/<id>/chat/` |
| `getAIChatHistory(sessionId)` | `GET /ai-review/<id>/chat/` |
| `getAdminStats()` | `GET /admin/stats/` |
| `getAdminUsers()` | `GET /admin/users/` |
| `getAdminUserDetail(userId)` | `GET /admin/users/<id>/` |
| `getMyMessages()` | `GET /messages/` |
| `getMyUnreadCount()` | `GET /messages/unread-count/` |
| `getAdminInbox()` | `GET /admin/messages/` |
| `getAdminUnreadCount()` | `GET /admin/messages/unread-count/` |
| `getAdminConversation(userId)` | `GET /admin/messages/<id>/` |
| `deleteMessage(messageId)` | `DELETE /admin/messages/delete/<id>/` |

### `authService.ts` (`services/authService.ts`)

Dedicated service for all auth operations. See the [auth docs](../auth/README.md) for full documentation.

---

## Server-side data fetching (`lib/serverApi.ts`)

For pages where data can be fetched at build or request time on the server, these helpers use the native `fetch` API so Next.js can apply its caching strategy.

| Function | Cache strategy |
|---|---|
| `fetchFeaturedScholarships()` | `no-store` - always fresh |
| `fetchScholarships(params?)` | Revalidates every 5 minutes |
| `fetchScholarship(id)` | Revalidates every 5 minutes |

Server components use `lib/serverApi.ts`. Client components use `services/api.ts`.

---

## Context providers

### `AuthContext`

Owns:

- current user
- initialization/loading state
- login/logout/register flows

### `MessagingContext`

Owns:

- WebSocket connection lifecycle
- unread support badge state
- last real-time message
- `send`, `broadcast`, and `markRead` actions

Unread counts are seeded from REST after login and re-fetched after `markRead()` to keep badges accurate even if messages arrived before the socket connected.

---

## TypeScript types (`types/index.ts`)

| Type | Description |
|---|---|
| `Scholarship` | Full scholarship object as returned by the API |
| `PaginatedResponse<T>` | Generic DRF pagination wrapper |
| `AuthTokens` | `{ access: string; refresh: string }` |
| `UserProfile` | `bio`, `institution`, `field_of_study`, `country` |
| `User` | User identity and role flags |
| `AuthResponse` | Extends `AuthTokens` with `user: User` |
| `AdminStats` | Admin dashboard aggregate platform + AI metrics |
| `AdminUser` | Admin table row for one user |
| `AdminUserDetail` | Expanded admin user detail payload |
| `Message` | Support message payload used in REST + WebSocket flows |
| `AdminConversation` | Admin inbox summary row |

---

## Route behavior

### Auth-gated pages

`/dashboard` and `/profile` check `initialising` and `user` from `AuthContext` and redirect to `/login` if the user is not authenticated. During initialization they render `null` to avoid a flash of unauthenticated content.

### Role-based routing

- `/admin` and `/admin/users/[id]` redirect non-staff users back to `/dashboard`
- `/login` redirects staff and superusers to `/admin` after successful sign-in
- the admin button in the navbar shows a live unread badge from `MessagingContext`

---

## Navbar (`components/Navbar.tsx`)

The navbar is auth-aware.

- Guest: shows Login and Register buttons.
- Authenticated user: shows AI Prep, Dashboard, Profile, and Logout.
- Staff/superuser: also shows an Admin button with the unread support count badge.

The floating support widget is suppressed for admin users because support conversations are handled from `/admin`.
