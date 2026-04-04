# Admin & Messaging

Admin tooling in ScholarAid is split across two backend areas:

- `backend/admin_api/` for dashboard stats and user detail APIs
- `backend/messaging/` for support inbox, unread counts, and realtime chat

The frontend admin experience lives in:

- `frontend/src/app/admin/page.tsx`
- `frontend/src/app/admin/users/[id]/page.tsx`
- `frontend/src/context/MessagingContext.tsx`

---

## Admin dashboard

### `GET /api/v1/admin/stats/`

Returns aggregate platform and AI metrics for staff or superusers.

`platform.unread_messages` is the count of unread user-to-admin support messages for the current admin user.
It is no longer derived from `core.ContactMessage`.

`platform.total_contact_messages` still reports the number of submitted contact-form entries.

### `GET /api/v1/admin/users/`

Returns all non-superuser accounts with:

- session totals
- reviewed session totals
- average AI score
- number of user Q&A prompts
- most recent AI-session activity timestamp

### `GET /api/v1/admin/users/<user_id>/`

Returns:

- account and profile fields
- every AI review session for that user
- feedback details when available
- stored AI chat history for each session

The frontend uses this data to power the admin user detail screen and its expandable session cards.

---

## Support messaging

ScholarAid has two messaging surfaces:

- Contact form submissions via `POST /api/v1/contact/`
- Authenticated support chat via the `messaging` app

The support chat is the live in-app channel used by the floating user widget and the admin inbox.

### User endpoints

#### `GET /api/v1/messages/`

Returns the authenticated user's thread with support plus any broadcast messages.
Incoming admin-to-user messages are marked as read when this endpoint is fetched.

#### `GET /api/v1/messages/unread-count/`

Returns:

```json
{ "unread": 3 }
```

This counts unread support messages sent from admins to the current user.

### Admin endpoints

#### `GET /api/v1/admin/messages/`

Returns conversation summaries for the current admin:

- user identity
- unread count per conversation
- last message preview

#### `GET /api/v1/admin/messages/unread-count/`

Returns the current admin's unread support count across all user conversations.

#### `GET /api/v1/admin/messages/<user_id>/`

Returns the full thread between the current admin and one user.
Unread messages from that user are marked as read on fetch.

#### `DELETE /api/v1/admin/messages/delete/<message_id>/`

Deletes a single support message. Admin only.

---

## Realtime behavior

`MessagingContext` opens a WebSocket connection at:

```text
/ws/messages/?token=<access-token>
```

Key frontend behavior:

- Connects once after login
- Seeds unread badges from REST so messages sent before WebSocket connection are still counted
- Re-fetches unread counts after `markRead()` so opening one admin thread does not clear badges for other threads
- Exposes `send`, `broadcast`, and `markRead` actions to the rest of the UI

User-facing chat UI:

- `frontend/src/components/MessagingWidget.tsx`
- visible only for authenticated non-admin users
- loads history from `GET /api/v1/messages/`

Admin-facing chat UI:

- `frontend/src/app/admin/page.tsx` for the inbox and broadcast composer
- `frontend/src/app/admin/users/[id]/page.tsx` for one-to-one support threads

---

## Broadcasts

Admins can send broadcasts from the admin dashboard.

Broadcast messages:

- are sent through the messaging WebSocket layer
- are delivered to connected users
- appear in the user support thread as `is_broadcast: true`
- are not tied to a single recipient
