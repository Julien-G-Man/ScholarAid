# ScholarAid Todo

## Current Focus

The old post-dashboard and auth/profile milestones are done.
The remaining work is now mostly production-hardening and final product gaps.

## Highest Priority

- [ ] Add email notifications.
- [ ] Wire up real LLM APIs for production use and verify end-to-end AI review/chat responses with actual provider keys.
- [ ] Fix and harden WebSocket messaging.

## Email Notifications

- [ ] Add outbound email configuration for the backend (`EMAIL_*` settings or provider-based equivalent).
- [ ] Send an email when a new contact form submission is received.
- [ ] Send admin/user notification emails for important support messages or broadcasts where appropriate.
- [ ] Add email notifications for AI review lifecycle events if needed (for example: submitted, reviewed, follow-up ready).
- [ ] Document all required email environment variables and local/dev behavior.

## LLM Integration

- [ ] Validate the multi-provider AI client against real provider credentials in a non-mock environment.
- [ ] Decide and document the production provider priority order.
- [ ] Confirm current model names, request formats, and fallback behavior for supported providers.
- [ ] Improve failure handling and user-facing messaging when all providers fail.
- [ ] Add a clear production setup guide for AI provider keys.

## Messaging and WebSockets

- [ ] Fix any remaining connection/reconnect issues in live messaging.
- [ ] Verify unread badge behavior across login, reconnect, thread open, and refresh flows.
- [ ] Verify admin inbox updates correctly for new messages, deleted messages, and broadcasts.
- [ ] Confirm message delivery works for user-to-admin, admin-to-user, and broadcast scenarios.
- [ ] Review message read-state handling, especially around broadcasts and multi-thread admin workflows.
- [ ] Add or update backend and frontend tests for the messaging flow.

## Remaining Product Gaps

- [ ] Implement deadline tracking/bookmarking to replace the current "Coming soon" dashboard placeholder.
- [ ] Review whether saved scholarships/favorites are still needed as a first-class user feature.
- [ ] Decide whether contact-form submissions should stay admin-only in Django admin or also surface inside the custom admin dashboard.

## Quality and Release Readiness

- [ ] Add integration tests for AI review, admin APIs, and authenticated messaging flows.
- [ ] Add a final production environment variable checklist across backend and frontend.
- [ ] Do a full end-to-end pass on the main user journeys: applicant flow, admin flow, AI flow, and support messaging.
- [ ] Clean up remaining stale docs so all guides match the shipped routes and features.
