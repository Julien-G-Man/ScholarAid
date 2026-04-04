# Scholarships

Scholarship data is managed through the `core` Django app on the backend and rendered via Next.js Server Components on the frontend.

---

## Backend

**App**: `backend/core/`

### Model: `Scholarships` (`core/models.py`)

| Field | Type | Notes |
|---|---|---|
| `name` | CharField(200) | Required |
| `provider` | CharField(100) | Required |
| `institution` | CharField(100) | Optional |
| `level` | CharField(100) | Optional — e.g. "Undergraduate", "Masters", "PhD" |
| `description` | TextField | Required |
| `eligibility` | TextField | Optional |
| `essay_prompt` | TextField | Optional — shown on the detail page and used by AI Review |
| `deadline` | DateField | Optional |
| `link` | URLField(300) | Optional — official application URL |
| `logo_url` | CharField(300) | Optional — URL to the scholarship logo image |
| `created_at` | DateTimeField | Auto-set |

Scholarships are managed exclusively through the Django admin panel — there is no public write API.

### Serializer: `ScholarshipSerializer` (`core/serializers.py`)

Exposes all model fields. Dates are serialized in `YYYY-MM-DD` format. Fields: `id`, `name`, `provider`, `institution`, `level`, `description`, `eligibility`, `essay_prompt`, `deadline`, `link`, `logo_url`, `created_at`.

### Query params serializer: `ScholarshipQuerySerializer`

Validates the optional `search` (max 120 chars) and `level` (max 60 chars) query parameters before they reach the ORM.

### API Endpoints (`core/api_urls.py`)

#### `GET /api/v1/scholarships/`

Returns a paginated list of all scholarships, ordered newest first.

**Query parameters** (all optional)

| Param | Description |
|---|---|
| `search` | Case-insensitive substring match across `name`, `description`, `provider`, `institution` |
| `level` | Case-insensitive substring match on the `level` field |
| `page` | Page number (default pagination: 20 per page) |

**Response** `200 OK`
```json
{
  "count": 42,
  "next": "http://localhost:8000/api/v1/scholarships/?page=2",
  "previous": null,
  "results": [
    {
      "id": 5,
      "name": "Fulbright",
      "provider": "U.S. Department of State",
      "institution": null,
      "level": "Masters",
      "description": "...",
      "eligibility": "...",
      "essay_prompt": "...",
      "deadline": "2025-10-15",
      "link": "https://fulbright.state.gov",
      "logo_url": "https://...",
      "created_at": "2024-09-01T12:00:00Z"
    }
  ]
}
```

---

#### `GET /api/v1/scholarships/featured/`

Returns the 3 most recently added scholarships. No pagination. Used on the homepage. Results are ordered by `-created_at, -id`.

**Response** `200 OK` — array of scholarship objects (same shape as above).

> **Route ordering note**: `scholarships/featured/` is registered before `scholarships/<pk>/` in `core/api_urls.py` so the literal string `featured` is not mistakenly parsed as an integer PK.

---

#### `GET /api/v1/scholarships/<id>/`

Returns the full detail of a single scholarship.

**Response** `200 OK` — single scholarship object.

**Response** `404 Not Found` — if the ID does not exist.

---

## Frontend

### Server-side data fetching (`frontend/src/lib/serverApi.ts`)

These functions run in Next.js Server Components (no client bundle) and use the native `fetch` API so Next.js can apply ISR caching.

| Function | Endpoint | Caching |
|---|---|---|
| `fetchFeaturedScholarships()` | `/scholarships/featured/` | `cache: 'no-store'` (always fresh) |
| `fetchScholarships(params?)` | `/scholarships/` | Revalidates every 5 minutes |
| `fetchScholarship(id)` | `/scholarships/<id>/` | Revalidates every 5 minutes |

All functions return an empty array or `null` on error rather than throwing, keeping Server Components resilient to backend unavailability.

### Pages

#### `/scholarships` (`app/scholarships/page.tsx`)

A Server Component that:
1. Reads `search` and `level` from `searchParams`.
2. Calls `fetchScholarships({ search, level })` server-side.
3. Renders a grid of `<ScholarshipCard>` components.
4. Shows a result-count line when filters are active.
5. Wraps `<ScholarshipFilters>` in `<Suspense>` because `useSearchParams()` requires it.

#### `/scholarships/[id]` (`app/scholarships/[id]/page.tsx`)

A Server Component that calls `fetchScholarship(id)` and calls `notFound()` if the scholarship doesn't exist. Renders:
- Name and provider header.
- Description, eligibility, and essay prompt sections.
- Sidebar with provider, institution, level, and deadline.
- Logo (if `logo_url` is set).
- "Visit Official Page" link and an "AI Essay Review" button linking to `/ai-review/<id>`.

### Components

#### `ScholarshipCard` (`components/ScholarshipCard.tsx`)

A card component for the scholarships grid. Displays name, provider, level, deadline, and a "View Details" link to `/scholarships/<id>`.

#### `ScholarshipFilters` (`components/ScholarshipFilters.tsx`)

A client component (uses `useSearchParams` and `useRouter`) that renders a search input and a level dropdown. On change it updates the URL query string, which triggers a re-render of the server-side `ScholarshipsPage`.
