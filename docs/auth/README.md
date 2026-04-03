# Authentication

ScholarAid uses JWT authentication provided by `djangorestframework-simplejwt`. Tokens are issued on login/register and stored in `localStorage` on the client.

---

## Backend

**App**: `backend/users/`

### Models

#### `UserProfile` (`users/models.py`)

A one-to-one extension of Django's built-in `User` model, created automatically on registration.

| Field | Type | Notes |
|---|---|---|
| `user` | OneToOneField | Linked to `django.contrib.auth.models.User` |
| `bio` | TextField | Optional |
| `institution` | CharField(200) | Optional |
| `field_of_study` | CharField(200) | Optional |
| `country` | CharField(100) | Optional |
| `created_at` | DateTimeField | Auto-set on creation |

### Serializers (`users/serializers.py`)

| Serializer | Purpose |
|---|---|
| `RegisterSerializer` | Validates `username`, `email`, `first_name`, `last_name`, `password`, `password2`. Runs Django's built-in password validators. Ensures both passwords match. |
| `UserSerializer` | Read serializer for `User` + nested `UserProfile`. Fields: `id`, `username`, `email`, `first_name`, `last_name`, `profile`. |
| `UserProfileSerializer` | `bio`, `institution`, `field_of_study`, `country`. Used nested inside `UserSerializer` and for partial PATCH updates. |

### API Endpoints (`users/api_urls.py`)

All endpoints are prefixed with `/api/v1/auth/`.

#### `POST /api/v1/auth/register/`

Creates a new user and a matching `UserProfile`. Returns the user object and a fresh token pair.

**Request body**
```json
{
  "username": "john",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepassword",
  "password2": "securepassword"
}
```

**Response** `201 Created`
```json
{
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile": {
      "bio": "",
      "institution": "",
      "field_of_study": "",
      "country": ""
    }
  },
  "access": "<jwt-access-token>",
  "refresh": "<jwt-refresh-token>"
}
```

**Errors** `400` — field validation errors (e.g. passwords don't match, weak password, duplicate username).

---

#### `POST /api/v1/auth/login/`

Standard JWT token obtain view (`TokenObtainPairView`). Returns an access token (60 min lifetime) and a refresh token (7 days).

**Request body**
```json
{ "username": "john", "password": "securepassword" }
```

**Response** `200 OK`
```json
{ "access": "<token>", "refresh": "<token>" }
```

---

#### `POST /api/v1/auth/logout/`

Requires authentication. Blacklists the provided refresh token so it can no longer be used to obtain new access tokens.

**Request body**
```json
{ "refresh": "<refresh-token>" }
```

**Response** `200 OK`
```json
{ "message": "Logged out successfully." }
```

---

#### `POST /api/v1/auth/token/refresh/`

Exchanges a valid refresh token for a new access token. Because `ROTATE_REFRESH_TOKENS = True`, a new refresh token is also issued and the old one is blacklisted.

**Request body**
```json
{ "refresh": "<refresh-token>" }
```

**Response** `200 OK`
```json
{ "access": "<new-access-token>", "refresh": "<new-refresh-token>" }
```

---

#### `GET /api/v1/auth/profile/`

Returns the authenticated user's profile.

**Headers**: `Authorization: Bearer <access-token>`

**Response** `200 OK` — same shape as the `user` object in the register response.

---

#### `PATCH /api/v1/auth/profile/`

Partial update. Accepts a mix of user-level fields (`first_name`, `last_name`, `email`) and profile-level fields (`bio`, `institution`, `field_of_study`, `country`). Only provided fields are updated.

**Request body** (all fields optional)
```json
{
  "first_name": "Johnny",
  "institution": "MIT",
  "country": "Ghana"
}
```

**Response** `200 OK` — updated full user object.

---

#### `POST /api/v1/auth/change-password/`

Changes the password for the authenticated user. Validates the old password and runs Django's built-in password strength validators on the new password.

**Request body**
```json
{
  "old_password": "current",
  "new_password": "newStrong1!",
  "new_password_2": "newStrong1!"
}
```

**Response** `200 OK`
```json
{ "message": "Password changed successfully." }
```

**Errors** `400` — old password incorrect, passwords don't match, weak new password.

---

### JWT Settings (`config/settings.py`)

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

Token blacklisting requires the `rest_framework_simplejwt.token_blacklist` app to be installed, which it is.

---

## Frontend

### Token storage

Tokens are stored in `localStorage` under the keys `access_token` and `refresh_token`. All storage access is guarded with `typeof window !== 'undefined'` checks for SSR safety.

### `authService` (`frontend/src/services/authService.ts`)

The single entry point for all auth API calls. Never import `axiosInstance` directly for auth operations — always go through this service.

| Method | Description |
|---|---|
| `register(data)` | POST to `/auth/register/`, stores tokens, returns `AuthResponse` |
| `login(username, password)` | POST to `/auth/login/`, stores tokens, returns `AuthResponse` |
| `logout()` | POST to `/auth/logout/` with the stored refresh token, then clears localStorage |
| `refreshToken()` | POST to `/auth/token/refresh/`, updates `access_token` in localStorage |
| `getProfile()` | GET `/auth/profile/` |
| `updateProfile(data)` | PATCH `/auth/profile/` |
| `changePassword(data)` | POST `/auth/change-password/` |
| `isAuthenticated()` | Returns `true` if `access_token` exists in localStorage |
| `_storeTokens(access, refresh)` | Internal — writes both tokens to localStorage |
| `_clearTokens()` | Internal — removes both tokens from localStorage |

### Axios interceptors (`frontend/src/services/axiosInstance.ts`)

Two interceptors are registered on the shared Axios instance:

1. **Request interceptor**: Reads `access_token` from localStorage and attaches it as `Authorization: Bearer <token>` on every outgoing request.
2. **Response interceptor**: On a `401` response, attempts a token refresh automatically using the stored refresh token. If the refresh succeeds, the original request is retried with the new token. If the refresh fails (expired or invalid), both tokens are cleared from localStorage.

### `AuthContext` (`frontend/src/context/AuthContext.tsx`)

A React context that holds the current user state and exposes auth actions to the entire component tree.

**State**

| Name | Type | Description |
|---|---|---|
| `user` | `User \| null` | Currently signed-in user, or `null` |
| `initialising` | `boolean` | `true` while the context is checking for a stored session on first mount |

**Actions**

| Name | Description |
|---|---|
| `login(username, password)` | Calls `authService.login`, then sets `user` |
| `logout()` | Calls `authService.logout`, then clears `user` |
| `setUser(user)` | Directly sets the user (used after registration) |

**Session restoration**: On first mount, if a token exists in localStorage, `getProfile()` is called to restore the session. If that call fails, tokens are cleared.

**Usage**
```tsx
import { useAuth } from '@/context/AuthContext';

const { user, login, logout } = useAuth();
```

`useAuth()` throws if called outside of `<AuthProvider>`.

### Pages

| Route | File | Notes |
|---|---|---|
| `/login` | `app/login/page.tsx` | Two-column layout. Calls `useAuth().login`, redirects to `/` on success. |
| `/register` | `app/register/page.tsx` | Two-column layout. Calls `authService.register` directly (to access the returned user), sets user in context via `setUser`, redirects to `/`. Field-level error display from API validation. |
| `/profile` | `app/profile/page.tsx` | Auth-gated — redirects to `/login` if unauthenticated. Two sections: profile form (account + academic info) and password change form. |
| `/dashboard` | `app/dashboard/page.tsx` | Auth-gated. Displays quick-action cards and a profile summary. |
