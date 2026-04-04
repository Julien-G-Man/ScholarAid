# ScholarAid

> *AI-powered scholarship management and application platform.*

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/Python-3.11-blue.svg)
![Django](https://img.shields.io/badge/Django-5.x-darkgreen.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)

---

## Features

- **Scholarship Listings** — Browse, search, and filter curated scholarship opportunities.
- **AI Application Review** — Submit essays for automated feedback powered by Claude.
- **AI Scholarship Intake** *(admin only)* — Paste a URL or raw text; Claude extracts all fields.
- **Scraper Pipeline** *(admin only)* — Bulk-scrape scholarship portals, Claude cleans data, download CSV, review, re-upload, ingest.
- **User Dashboard** — Track deadlines, applications, and progress.
- **Admin Tools** — Manage scholarships and review applicants securely.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 5.x + Django REST Framework |
| Frontend | Next.js 16 (App Router) |
| Auth | JWT via SimpleJWT |
| AI | Anthropic Claude (`claude-opus-4-6`) |
| Scraping | requests + BeautifulSoup4 |
| Database | SQLite (dev), PostgreSQL (prod) |
| Styling | Bootstrap 5 + Bootstrap Icons |

---

## Project Structure

```
ScholarAid/
├── backend/
│   ├── config/           Settings, URL root
│   ├── admin_api/        Admin dashboard APIs + admin scholarship intake APIs
│   ├── core/             Scholarships, newsletter, contact
│   ├── users/            Auth, profiles
│   ├── ai_review/        Essay review
│   ├── scraper/          Bulk scraping pipeline (owns scrape/ingest logic + endpoints)
│   │   ├── scrapers/     Per-site scraper classes
│   │   ├── management/commands/
│   │   │   ├── scrape_scholarships.py
│   │   │   └── ingest_scholarships.py
│   │   ├── pipeline.py   Claude batch extraction
│   │   ├── tasks.py      Shared scrape/ingest logic
│   │   └── status.py     File-based job status
│   └── data/             Generated CSVs + status JSON
└── frontend/src/
    ├── app/
    │   ├── admin/scholarships/intake/    AI single-item intake
    │   └── admin/scholarships/pipeline/  Bulk scraper pipeline UI
    ├── components/
    ├── context/           AuthContext
    ├── services/          api.ts, authService.ts
    └── types/             Shared TypeScript interfaces
```

---

## Installation

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # or edit .env directly
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables (`backend/.env`)

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `True` / `False` |
| `ALLOWED_HOSTS` | Comma-separated hosts |
| `FRONTEND_URL` | Next.js base URL (for CORS) |
| `ANTHROPIC_API_KEY` | Key from [console.anthropic.com](https://console.anthropic.com) |

---

## API Endpoints

| Method | URL | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/scholarships/` | Public | List/search scholarships |
| GET | `/api/v1/scholarships/featured/` | Public | Featured scholarships |
| GET | `/api/v1/scholarships/<id>/` | Public | Scholarship detail |
| POST | `/api/v1/newsletter/subscribe/` | Public | Newsletter sign-up |
| POST | `/api/v1/contact/` | Public | Contact form |
| POST | `/api/v1/auth/register/` | Public | Register |
| POST | `/api/v1/auth/login/` | Public | Login (returns JWT) |
| POST | `/api/v1/auth/logout/` | Auth | Logout |
| POST | `/api/v1/auth/token/refresh/` | Public | Refresh access token |
| GET/PATCH | `/api/v1/auth/profile/` | Auth | View/update profile |
| POST | `/api/v1/ai-review/<id>/` | Auth | Submit essay for AI review |
| POST | `/api/v1/admin/scholarships/extract/` | Admin | AI-extract fields from URL/text |
| POST | `/api/v1/admin/scholarships/` | Admin | Create scholarship after review |
| POST | `/api/v1/admin/scraper/scrape/` | Admin | Start bulk scrape job |
| GET | `/api/v1/admin/scraper/status/` | Admin | Poll job status |
| GET | `/api/v1/admin/scraper/download/` | Admin | Download latest scraped CSV |
| POST | `/api/v1/admin/scraper/ingest/` | Admin | Upload CSV and ingest |

---

## Scraper Pipeline (Admin)

### Strategy (high level)

The scraper follows a navigation + AI extraction strategy:

- Site scrapers (`scraper/scrapers/*.py`) handle pagination and detail-page discovery only.
- Raw detail-page HTML is sent to `scraper/pipeline.py` for Claude extraction and normalization.
- Validation/filtering runs before output: malformed records are dropped and expired deadlines are skipped.
- Results are written to CSV first for human review.
- Final DB writes happen only during ingest (API or CLI), with duplicate checks (`name + provider`).

### Ownership

- `admin_api` owns admin dashboard + admin scholarship intake endpoints (`/api/v1/admin/*`).
- `scraper` owns scraper endpoints and scraping/ingest logic (`/api/v1/admin/scraper/*`).
- `core` owns public scholarship/newsletter/contact APIs.

### How it works

```
Portal website
    ↓ (requests + BeautifulSoup — navigation only)
Raw detail page HTML
    ↓ (Claude claude-opus-4-6 + adaptive thinking — batches of 5)
Cleaned + validated scholarship JSON
    ↓ (expired deadlines filtered, today checked)
CSV file  →  admin downloads  →  reviews in Excel/Sheets
    ↓ (admin uploads reviewed CSV)
Database  (duplicates skipped: same name + provider)
```

### CLI usage

```bash
# Scrape with default limit (500) from MastersPortal
python manage.py scrape_scholarships

# Scrape a custom number of scholarships
python manage.py scrape_scholarships --limit 100
python manage.py scrape_scholarships --limit 1000

# Scrape a different source with a custom limit
python manage.py scrape_scholarships --source scholarshipportal --limit 200
python manage.py scrape_scholarships --source opportunitiesforafricans --limit 200

# Preview ingest without writing to DB
python manage.py ingest_scholarships --dry-run

# Ingest a specific CSV
python manage.py ingest_scholarships --input backend/data/scholarships_mastersportal_20260404.csv
```

### Controlling the scrape limit

You have full control over how many scholarships are scraped per run:

- **Admin UI** (`/admin/scholarships/pipeline`) — edit the **Limit** field before clicking "Start Scrape". Defaults to 500, accepts any value from 10 to 2000.
- **CLI** — pass `--limit <n>` with any positive integer. No upper cap on the command line.

The limit applies to *valid, non-expired* scholarships collected. The scraper may fetch more pages than the limit suggests because expired or malformed entries are discarded along the way.

### Available sources

| `--source` | Site |
|---|---|
| `mastersportal` | MastersPortal.eu |
| `scholarshipportal` | ScholarshipPortal.com |
| `opportunitiesforafricans` | Opportunities For Africans (Undergraduate category) |

---

## AI Intake (Admin — single scholarship)

Staff users see an **Admin** dropdown in the navbar with two options:

- **AI Intake (single)** — `/admin/scholarships/intake`: paste a URL or raw text, Claude extracts all fields, you review and edit, then save.
- **Scraper Pipeline** — `/admin/scholarships/pipeline`: bulk scrape, download CSV, review, upload, ingest.

---

## License

MIT

