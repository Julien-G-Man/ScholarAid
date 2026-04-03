# AI Prep Frontend — Complete Guide

## Pages Created

### 1. `/ai-prep` — Hub & Discovery
**File:** `frontend/src/app/ai-prep/page.tsx`

**Features:**
- Display featured scholarships in card grid
- See work-in-progress sessions in sidebar
- Quick start guide (how it works)
- Link to view all past sessions
- Auth gated (redirect to login if unauthenticated)

**Layout:**
- Left column: Featured scholarships (clickable cards)
- Right sidebar: Active sessions + how-it-works info

**Card design:**
- Scholarship name, provider, level, deadline
- Description preview
- Hover animation (lift effect)
- Click to navigate to detail page

---

### 2. `/ai-prep/{scholarship_id}` — Multi-Tab Interface
**File:** `frontend/src/app/ai-prep/[id]/page.tsx`

**This is the core interface.** 5-tab layout for comprehensive application prep:

#### Tab 1: **Requirements** (Read-Only)
- Scholarship eligibility requirements
- Essay prompt (highlighted in box)
- Static scholarship details

#### Tab 2: **Guides** (Read-Only)
- Accordion with 5 expandable sections:
  - Scholarship Overview
  - Detailed Requirements
  - Essay Writing Tips
  - Common Mistakes
  - How to Stand Out
- Each guide is Markdown content rendered as prose

#### Tab 3: **Essay Review** (Submit)
- Text input area (textarea, 10 rows)
- OR File upload (PDF, DOCX, TXT, MD)
- Submit button triggers `api.submitAIReview()`
- On success: creates session, auto-switches to Feedback tab

#### Tab 4: **Feedback** (Conditional)
- ⭐ Overall score (0-100, large display)
- 5 feedback sections:
  - Structure
  - Clarity
  - Relevance
  - Persuasiveness
  - Grammar & Style
- Strengths list (green checkmarks)
- Improvements list (yellow lightbulbs)
- Next steps guidance

#### Tab 5: **Q&A Chat** (Interactive)
- Disabled if no active session
- Chat history scrollable
- User messages: right-aligned, red background
- AI messages: left-aligned, light background
- Input at bottom with Send button
- Real-time conversation flow

**Header:**
- Scholarship name (large, bold)
- Provider, level, deadline
- Link to view on original site (external)

---

### 3. `/ai-prep/reviews` — History & Management
**File:** `frontend/src/app/ai-prep/reviews/page.tsx`

**Features:**
- Filter sessions by status (All, In Progress, Reviewed, Archived)
- Table showing:
  - Scholarship name
  - Status badge (color-coded)
  - Overall score (if reviewed)
  - Last updated date
  - Continue button (link back to detail page)
- Empty state with encouragement to start a review
- Auth gated

**Status badges:**
- In Progress: Yellow
- Submitted: Blue
- Reviewed: Green
- Archived: Gray

---

## API Integration

**Pages call these API methods:**

### `/ai-prep` Hub
```typescript
api.getFeaturedScholarships()     // Show featured scholarships
api.getAIReviewSessions()         // Show active work-in-progress
```

### `/ai-prep/{id}` Detail
```typescript
api.getScholarship(id)            // Scholarship info & details
api.getAIPreparationGuides(id)    // Get all 5 guides for this scholarship
api.getAIReviewSessions()         // Find existing session for this scholarship
api.submitAIReview(data)          // POST essay + scholarship_id
api.sendAIChatMessage(id, msg)    // POST chat message
api.getAIChatHistory(id)          // GET chat history (auto-fetched on detail load)
```

### `/ai-prep/reviews` History
```typescript
api.getAIReviewSessions()         // List all sessions
```

---

## Component Architecture

### State Management
- **useAuth()** — User authentication context (redirect if not logged in)
- **useState** — Local form states (essayText, essayFile, chatMessage, etc.)
- **useEffect** — Fetch data on mount

### Key Patterns
- **Auth gating:** All pages check `user` and redirect to `/login` if missing
- **Multi-tab tabs:** Classic button + conditional rendering approach
- **Forms:** Controlled inputs with error + loading states
- **Async:** All API calls wrapped with try-catch, loading spinners

---

## Styling & UX

### Colors
- Primary brand red: `var(--primary-brand-red)` (#A31F34)
- Light brand: `var(--secondary-light)` (#FCE8E9)
- Bootstrap utilities (btn, alert, badge, etc.)

### Components
- **Tabs:** Button-based nav with conditionally rendered content
- **Cards:** shadow-sm, border-0, rounded-4
- **Forms:** form-control, form-control-lg, rounded-3
- **Buttons:** btn-primary-brand, btn-outline-primary-brand, rounded-pill
- **Badges:** status-colored (warning, info, success, secondary)

### Animations
- Hover effects on scholarship cards (translateY, box-shadow)
- Button hover states (built-in Bootstrap)
- Smooth transitions on tabs

---

## Error Handling

All pages handle:
- **Loading state:** Display nothing until data loaded
- **Network errors:** Try-catch with user-friendly message
- **Form validation:** Check input before submit
- **Missing data:** Conditional rendering (e.g., "No guides available yet")

---

## Next Steps

1. **Claude API Integration**
   - Replace stub in `AIChatView._generate_ai_response()`
   - Replace placeholder text in submit response

2. **File Parsing**
   - Extract text from PDF/DOCX uploads
   - Store parsed content in `EssayFeedback.essay_text`

3. **Seed ApplicationGuides**
   - Via Django admin or fixture
   - Populate with real guidance for each scholarship

4. **Document Generation**
   - Create `/api/v1/ai-review/{session_id}/export/` endpoint
   - Generate PDF/DOCX from feedback

5. **Analytics & Tracking**
   - Track which scholarships users focus on
   - Measure essay review adoption

---

## Files Modified/Created

**New files:**
- ✅ `frontend/src/app/ai-prep/page.tsx` (hub)
- ✅ `frontend/src/app/ai-prep/[id]/page.tsx` (detail + tabs)
- ✅ `frontend/src/app/ai-prep/reviews/page.tsx` (history)

**Updated files:**
- ✅ `frontend/src/services/api.ts` (+6 methods)
- ✅ `frontend/src/types/index.ts` (+5 types)
- ✅ `frontend/src/components/Navbar.tsx` (AI Prep link)
- ✅ `frontend/src/app/dashboard/page.tsx` (AI Prep button)
- ✅ `frontend/src/app/globals.css` (+prose styles)

---

## Testing Checklist

- [ ] Login → Redirect to `/login` ✓
- [ ] `/ai-prep` hub loads featured scholarships
- [ ] Click scholarship card → Navigate to detail page
- [ ] Read all 5 guide tabs
- [ ] Submit essay (text) → Session created
- [ ] View feedback
- [ ] Send chat message → Appears in chat
- [ ] View session history in `/ai-prep/reviews`
- [ ] Filter sessions by status
- [ ] File upload support (UI ready, backend parsing TBD)
- [ ] Navbar shows "AI Prep" link when logged in

