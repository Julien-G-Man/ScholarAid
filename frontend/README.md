# ScholarAid Frontend

Next.js 16 App Router frontend for ScholarAid.

It provides:

- public scholarship browsing
- authentication flows
- AI Prep and AI review session pages
- user dashboard and profile management
- admin dashboard and user detail views
- realtime support messaging via a floating user widget and admin inbox

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

This single variable powers:

- client-side Axios requests
- server-side fetch helpers
- the WebSocket base URL used by support messaging

## Key folders

```text
frontend/src/
|-- app/          # App Router pages
|-- components/   # Shared UI including Navbar, Footer, MessagingWidget
|-- context/      # AuthContext and MessagingContext
|-- lib/          # Server-side API helpers
|-- services/     # API clients
`-- types/        # Shared API payload types
```

## Learn More

Project-specific docs:

- [Main project README](../README.md)
- [Frontend architecture docs](../docs/frontend/README.md)
- [Admin and messaging docs](../docs/admin/README.md)

Framework docs:

- [Next.js Documentation](https://nextjs.org/docs)

## Deploy on Vercel

The app can be deployed on Vercel or any platform that supports Next.js 16. Make sure `NEXT_PUBLIC_API_URL` points at the deployed backend API base path.

See [deployment docs](../docs/deployment/README.md) for backend and environment details.
