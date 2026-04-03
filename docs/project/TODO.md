# ScholarAid Todo

## Next Phase: Post-Dashboard Flow

- [ ] Design and implement post-login dashboard user flow.
- [ ] Define dashboard information architecture (quick actions, recent activity, saved scholarships).
- [ ] Add role-aware routing/guards for authenticated pages.

## Authentication Gating

- [ ] Require sign up/sign in before users can access AI review features.
- [ ] Protect AI review routes and API endpoints for authenticated users only.
- [ ] Add clear redirect flow to login/register when unauthenticated users attempt AI actions.

## Profile and Account Management

- [ ] Build user profile page (basic info, institution, field of study, country, bio).
- [ ] Add profile edit/update flow with validation and success/error feedback.
- [ ] Add account settings section (password change, session/logout controls).

## Supporting Tasks

- [ ] Add/update tests for auth guards, AI access restrictions, and profile APIs.
- [ ] Update frontend navigation for authenticated vs guest states.
- [ ] Document final flow and deployment environment variables after implementation.
