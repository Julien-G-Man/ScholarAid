# ScholarAid AI System — Architecture & API Reference

## Overview

The new AI system is a **comprehensive scholarship application assistant** that helps students prepare, write, and refine their scholarship applications. It combines scholarship knowledge with personalized essay feedback and Q&A guidance.

**Key features:**
- Scholarship-specific preparation guides (requirements, essay tips, standing out strategies)
- Smart essay review with structured feedback (not essay-writing)
- Q&A chat for application guidance
- Session tracking and feedback history

---

## Backend Architecture

### Models

#### `ApplicationGuide`
Pre-built guidance for each scholarship, organized by category.

```python
ApplicationGuide
├── scholarship (FK → Scholarships)
├── category (choice: overview | requirements | essay_tips | common_mistakes | standing_out)
├── content (TextField — Markdown)
└── timestamps
```

#### `AIReviewSession`
Tracks a user's work on a specific scholarship application.

```python
AIReviewSession
├── user (FK → User)
├── scholarship (FK → Scholarships)
├── status (choice: in_progress | submitted | reviewed | archived)
├── notes (TextField)
└── timestamps
```

#### `EssayFeedback`
Detailed feedback on an essay submission tied to a session.

```python
EssayFeedback (OneToOne → AIReviewSession)
├── essay_text (TextField)
├── essay_file_name (CharField)
├── overall_score (0-100)
├── structure_feedback (TextField)
├── clarity_feedback (TextField)
├── relevance_feedback (TextField)
├── persuasiveness_feedback (TextField)
├── grammar_feedback (TextField)
├── strengths (JSON string)
├── improvements (JSON string)
├── next_steps (guidance)
└── reviewed_at (DateTimeField)
```

#### `ChatMessage`
Messages in Q&A sessions.

```python
ChatMessage
├── session (FK → AIReviewSession)
├── role (choice: user | ai)
├── content (TextField)
└── created_at
```

---

## API Endpoints

### 1. Get Preparation Guides
**GET** `/api/v1/ai-prep/{scholarship_id}/`

No authentication required (public guides).

**Response:**
```json
{
  "scholarship": "Fulbright Scholarship",
  "guides": [
    {
      "id": 1,
      "category": "overview",
      "content": "# Fulbright Overview\n\n...",
      "created_at": "2026-04-03T10:00:00Z"
    },
    {
      "id": 2,
      "category": "essay_tips",
      "content": "# Essay Writing Guide\n\n...",
      "created_at": "2026-04-03T10:00:00Z"
    }
  ]
}
```

---

### 2. Submit Essay for Review
**POST** `/api/v1/ai-review/`

**Required:** Authentication

**Request body (multipart/form-data):**
```json
{
  "scholarship_id": 5,
  "essay_text": "My essay text..." OR "essay_file": <File>
}
```

**Response (201 Created):**
```json
{
  "id": 123,
  "scholarship": 5,
  "status": "reviewed",
  "notes": "",
  "feedback": {
    "id": 45,
    "overall_score": 0,
    "structure_feedback": "Being analyzed...",
    ...
  },
  "chat_messages": [],
  "created_at": "2026-04-03T10:00:00Z",
  "updated_at": "2026-04-03T10:00:00Z"
}
```

---

### 3. Get Review Session Details
**GET** `/api/v1/ai-review/{session_id}/`

**Required:** Authentication (own session only)

**Response:**
```json
{
  "id": 123,
  "scholarship": 5,
  "status": "reviewed",
  "notes": "Notes from student",
  "feedback": {
    "id": 45,
    "overall_score": 75,
    "structure_feedback": "Good intro, needs stronger conclusion",
    "clarity_feedback": "Clear language throughout",
    "relevance_feedback": "Addresses scholarship values well",
    "persuasiveness_feedback": "Strong case for why you're a fit",
    "grammar_feedback": "Minor typo in paragraph 3",
    "strengths": "[\"Personal story\", \"Clear vision\"]",
    "improvements": "[\"Strengthen conclusion\", \"Add more specific examples\"]",
    "next_steps": "Review the suggestions and revise paragraph 3...",
    "reviewed_at": "2026-04-03T10:05:00Z"
  },
  "chat_messages": [
    {
      "id": 101,
      "role": "user",
      "content": "How do I strengthen my conclusion?",
      "created_at": "2026-04-03T10:10:00Z"
    },
    {
      "id": 102,
      "role": "ai",
      "content": "A strong conclusion should restate...",
      "created_at": "2026-04-03T10:11:00Z"
    }
  ],
  "created_at": "2026-04-03T10:00:00Z",
  "updated_at": "2026-04-03T10:15:00Z"
}
```

---

### 4. Get All Review Sessions (User History)
**GET** `/api/v1/ai-prep/reviews/`

**Required:** Authentication

**Response:** Array of AIReviewSession objects (same structure as above)

---

### 5. Send Chat Message
**POST** `/api/v1/ai-review/{session_id}/chat/`

**Required:** Authentication

**Request body:**
```json
{
  "message": "How should I address the essay prompt about leadership?"
}
```

**Response (201 Created):**
```json
{
  "session_id": 123,
  "messages": [
    {
      "id": 101,
      "role": "user",
      "content": "How do I strengthen my conclusion?",
      "created_at": "2026-04-03T10:10:00Z"
    },
    {
      "id": 102,
      "role": "ai",
      "content": "A strong conclusion...",
      "created_at": "2026-04-03T10:11:00Z"
    },
    {
      "id": 103,
      "role": "user",
      "content": "How should I address the essay prompt about leadership?",
      "created_at": "2026-04-03T10:20:00Z"
    },
    {
      "id": 104,
      "role": "ai",
      "content": "Leadership essays should demonstrate...",
      "created_at": "2026-04-03T10:21:00Z"
    }
  ]
}
```

---

### 6. Get Chat History
**GET** `/api/v1/ai-review/{session_id}/chat/`

**Required:** Authentication

**Response:**
```json
{
  "session_id": 123,
  "scholarship": "Fulbright Scholarship",
  "messages": [
    {
      "id": 101,
      "role": "user",
      "content": "How do I strengthen my conclusion?",
      "created_at": "2026-04-03T10:10:00Z"
    },
    ...
  ]
}
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200 OK** — GET operations successful
- **201 Created** — POST operations successful
- **400 Bad Request** — Invalid input (missing fields, validation errors)
- **401 Unauthorized** — Missing or invalid authentication token
- **403 Forbidden** — User doesn't have access (session belongs to another user)
- **404 Not Found** — Resource doesn't exist
- **500 Internal Server Error** — Server error

**Error response format:**
```json
{
  "error": "Description of the error"
}
```

---

## Authentication

All endpoints except `/api/v1/ai-prep/{scholarship_id}/` require JWT authentication. Include the access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

---

## Integration Notes

1. **File Upload Handling** — Essays can be submitted as text or files (PDF, DOCX, TXT, MD). File parsing/extraction is a placeholder — implement PDF/DOCX parsing later.

2. **AI Responses** — The `_generate_ai_response()` method in `AIChatView` is a stub. Integration with Claude API will replace this with real responses.

3. **ApplicationGuide Data** — These should be seeded via Django fixtures or admin panel. Each scholarship should have 5 guides (overview, requirements, essay_tips, common_mistakes, standing_out).

4. **File Storage** — Ensure `MEDIA_URL` and `MEDIA_ROOT` are configured for file uploads.

---

## Next Steps

1. **Create migrations** — `python manage.py makemigrations ai_review`
2. **Apply migrations** — `python manage.py migrate`
3. **Seed ApplicationGuides** — Add via Django admin or fixture
4. **Integrate Claude API** — Replace placeholder AI responses with real Claude calls
5. **Build frontend** — Create `/ai-prep` hub and multi-tab interface
6. **File parsing** — Implement PDF/DOCX text extraction
7. **Document generation** — Wire PDF/DOCX output for generated documents (later)

