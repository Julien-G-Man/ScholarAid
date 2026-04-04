# Core - Newsletter & Contact

The `core` Django app owns the `Scholarships` model (see [scholarships docs](../scholarships/README.md)), and also provides the newsletter subscription and contact form features.

---

## Newsletter

### Model: `NewsletterSubscription` (`core/models.py`)

| Field | Type | Notes |
|---|---|---|
| `email` | EmailField | Unique - duplicate emails are rejected |
| `created_at` | DateTimeField | Auto-set |

### API Endpoint

#### `POST /api/v1/newsletter/subscribe/`

Public endpoint. Stores the email address in the database.

**Request body**
```json
{ "email": "user@example.com" }
```

**Response** `201 Created`
```json
{ "message": "Thank you for subscribing!" }
```

**Errors** `400` - invalid email format, or email is already subscribed.

### Frontend component

`NewsletterForm` (`components/NewsletterForm.tsx`) - a client component rendered in the footer. Calls `api.subscribeNewsletter(email)` on submit and shows inline success/error feedback.

---

## Contact Form

### Model: `ContactMessage` (`core/models.py`)

| Field | Type | Notes |
|---|---|---|
| `name` | CharField(100) | Required |
| `email` | EmailField | Required |
| `subject` | CharField(200) | Optional |
| `message` | TextField | Required |
| `is_read` | BooleanField | Default `False` - for admin tracking |
| `created_at` | DateTimeField | Auto-set |

Records are ordered by `-created_at` by default (newest first in admin).

### API Endpoint

#### `POST /api/v1/contact/`

Public endpoint. Stores the submitted message in the database. No email is sent - messages are reviewed in the Django admin panel.

**Request body**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "subject": "Question about Fulbright",
  "message": "I wanted to ask..."
}
```

**Response** `201 Created`
```json
{ "message": "Thanks for reaching out! We'll get back to you soon." }
```

**Errors** `400` - missing required fields or invalid email.

### Frontend page

`/contact` (`app/contact/page.tsx`) - a client component form that calls `api.submitContact(data)` on submit. Shows a success message or inline field errors.

---

## Relationship to support chat

The contact form is separate from the authenticated support chat system.

- Contact submissions are stored as `core.ContactMessage`
- In-app support messages are stored as `messaging.Message`
- Admin stats expose both values separately:
  - `total_contact_messages`
  - `unread_messages` for live support inbox items

See [admin docs](../admin/README.md) for the messaging flow.

---

## Admin

Both `NewsletterSubscription` and `ContactMessage` are registered in `core/admin.py`. The `is_read` flag on `ContactMessage` lets the team mark messages as handled directly from the Django admin.
