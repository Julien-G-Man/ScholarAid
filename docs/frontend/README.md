# Frontend Architecture

The frontend is a Next.js 16 application using the App Router. It is written in TypeScript and styled with Bootstrap 5 and Bootstrap Icons.

Additional frontend feature docs:
- [AI Prep](ai-prep.md)

---

## Directory layout

```
frontend/src/
├── app/                   # App Router pages and layouts
│   ├── layout.tsx         # Root layout — wraps all pages with Providers, Navbar, Footer
│   ├── page.tsx           # Homepage (/)
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── dashboard/page.tsx       # Auth-gated
│   ├── profile/page.tsx         # Auth-gated
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── scholarships/
│   │   ├── page.tsx             # Scholarship list
│   │   └── [id]/page.tsx        # Scholarship detail
│   └── ai-review/
│       └── [id]/page.tsx        # AI essay review form
├── components/            # Shared UI components
├── context/               # React context providers
├── lib/                   # Server-side data fetching helpers
├── services/              # Client-side API services
└── types/                 # Shared TypeScript types
```

---

## Root layout (`app/layout.tsx`)

Every page is wrapped by:
- `<Providers>` — mounts `AuthProvider` so the entire tree can access auth state.
- `<BootstrapClient>` — dynamically imports Bootstrap JS on the client to enable dropdowns, collapses, etc.
- `<Navbar>` — global navigation bar, auth-aware.
- `<Footer>` — includes the `NewsletterForm`.

---

## Services layer

Two separate modules handle API communication from the client side.

### `axiosInstance` (`services/axiosInstance.ts`)

A configured Axios instance shared by `api.ts` and `authService.ts`.

- Base URL: `NEXT_PUBLIC_API_URL` environment variable, defaulting to `http://localhost:8000/api/v1`.
- **Request interceptor**: Attaches the stored `access_token` as a Bearer token on every request.
- **Response interceptor**: On `401`, silently refreshes the token and retries the original request. On refresh failure, clears localStorage and lets the error propagate.

### `api.ts` (`services/api.ts`)

General-purpose client for non-auth endpoints. All methods return typed promises.

| Method | Endpoint |
|---|---|
| `getScholarships(params?)` | `GET /scholarships/` |
| `getFeaturedScholarships()` | `GET /scholarships/featured/` |
| `getScholarship(id)` | `GET /scholarships/<id>/` |
| `subscribeNewsletter(email)` | `POST /newsletter/subscribe/` |
| `submitContact(data)` | `POST /contact/` |
| `submitAIReview(scholarshipId, payload)` | `POST /ai-review/<id>/` |

### `authService.ts` (`services/authService.ts`)

Dedicated service for all auth operations. See the [auth docs](../auth/README.md) for full documentation.

---

## Server-side data fetching (`lib/serverApi.ts`)

For pages where data can be fetched at build or request time on the server, these helpers use the native `fetch` API (not Axios) so Next.js can apply its ISR caching strategy.

| Function | Cache strategy |
|---|---|
| `fetchFeaturedScholarships()` | `no-store` — always fresh |
| `fetchScholarships(params?)` | Revalidates every 5 minutes |
| `fetchScholarship(id)` | Revalidates every 5 minutes |

Server components (e.g. `scholarships/page.tsx`, `scholarships/[id]/page.tsx`) use `lib/serverApi.ts`. Client components (e.g. `ai-review/[id]/page.tsx`) use `services/api.ts`.

---

## TypeScript types (`types/index.ts`)

| Type | Description |
|---|---|
| `Scholarship` | Full scholarship object as returned by the API |
| `PaginatedResponse<T>` | Generic DRF pagination wrapper: `count`, `next`, `previous`, `results` |
| `AuthTokens` | `{ access: string; refresh: string }` |
| `UserProfile` | `bio`, `institution`, `field_of_study`, `country` |
| `User` | `id`, `username`, `email`, `first_name`, `last_name`, `profile?` |
| `AuthResponse` | Extends `AuthTokens` with `user: User` |

---

## Auth-gated pages

`/dashboard` and `/profile` both check `initialising` and `user` from `AuthContext` and redirect to `/login` if the user is not authenticated. During the initialisation phase (`initialising === true`) they render `null` to avoid a flash of unauthenticated content.

```tsx
useEffect(() => {
  if (!initialising && !user) router.replace('/login');
}, [initialising, user, router]);

if (initialising || !user) return null;
```

---

## Navbar (`components/Navbar.tsx`)

The navbar is auth-aware. It reads `user` from `AuthContext`:

- **Guest**: shows Login and Register buttons.
- **Authenticated**: shows Dashboard, Profile (with display name), and a Logout button. Logout calls `authService.logout()` and redirects to `/`.
