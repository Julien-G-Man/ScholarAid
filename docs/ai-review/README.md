# AI Review

The AI Review feature lets users submit a scholarship essay — either as plain text or an uploaded file — and receive automated feedback. The backend endpoint is wired up and validated; the actual AI model integration is still pending (marked `TODO`).

Additional AI review docs:
- [Implementation Overview](implementation-overview.md)
- [Backend Architecture](backend-architecture.md)
- [Provider Integration](provider-integration.md)
- [Provider Implementation Summary](provider-implementation-summary.md)

---

## Backend

**App**: `backend/ai_review/`

### Serializer: `AIReviewSubmitSerializer` (`ai_review/serializers.py`)

Accepts either `essay_text` (plain text) or `essay_file` (file upload). Validation ensures at least one of the two is provided.

| Field | Type | Required |
|---|---|---|
| `essay_text` | CharField | No — but one of the two must be present |
| `essay_file` | FileField | No — but one of the two must be present |

### API Endpoint

#### `POST /api/v1/ai-review/<scholarship_id>/`

Accepts a multipart form submission. Validates the input, and currently returns a placeholder `202 Accepted` response while the AI model integration is being built.

**URL parameter**: `scholarship_id` — the integer ID of the scholarship the essay is targeting.

**Request** (multipart/form-data)

```
essay_text=<plain text essay>
```
or
```
essay_file=<file upload>
```

**Response** `202 Accepted`
```json
{
  "scholarship_id": 5,
  "message": "Essay received. AI review is being processed.",
  "feedback": null
}
```

**Response** `400 Bad Request` — if neither `essay_text` nor `essay_file` is provided.

> **Current status**: The view returns a stub response. The `feedback` field is always `null`. The TODO comment in `ai_review/api_views.py` marks where the AI model call will be wired in.

> **Permission**: Currently `AllowAny`. Per the project TODO, this endpoint will be restricted to authenticated users once auth gating is implemented.

**Accepted file types** (enforced on the frontend): `.pdf`, `.doc`, `.docx`, `.txt`, `.pptx`, `.md`.

---

## Frontend

### Client service (`frontend/src/services/api.ts`)

```ts
api.submitAIReview(scholarshipId, payload)
```

Constructs a `FormData` object and POSTs to `/ai-review/<scholarshipId>/` with `Content-Type: multipart/form-data`. The `payload` accepts either `{ essay_text: string }` or `{ essay_file: File }`.

### Page: `/ai-review/[id]` (`app/ai-review/[id]/page.tsx`)

A client component (requires `'use client'` because it manages form state).

**Behaviour**:
- Reads the scholarship ID from the URL `params`.
- Presents a tabbed form: "Enter Text" (textarea) or "Upload File" (file input).
- On submit calls `api.submitAIReview(scholarshipId, payload)`.
- Shows a success banner with the API message (and feedback if present).
- Shows an error banner on failure.

**Navigation path**: The scholarship detail page (`/scholarships/[id]`) shows an "AI Essay Review" button that links directly to `/ai-review/<id>`, so the scholarship context is carried over.
