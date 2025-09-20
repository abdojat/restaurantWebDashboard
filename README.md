# Borcella — Restaurant Management Dashboard (Web)

Welcome to the Borcella Restaurant Management Dashboard. This web application is a responsive admin interface designed to streamline restaurant operations — orders, reservations, staff, menu, and analytics — and to integrate with a REST backend.

## Who is this for

- Restaurant owners and managers who need a single-pane view of operations
- Developers integrating with a backend API to provide CRUD and management features
- Teams who want a role-based admin interface (admin, manager, cashier)

## Highlights

- Fast development with Vite and React (TypeScript)
- TailwindCSS for utility-first styling and responsive design
- Role-based navigation and protected routes
- React Query for server-state, caching, and background fetching
- Axios-backed API client with token authentication
- Management interfaces for Users, Roles, Tables, Reservations, Categories, Dishes, and Orders

## Screens and features

- Landing page and login
- Dashboard home with statistics and recent activity
- CRUD pages for users, tables, categories, dishes
- Reservations and orders management with filtering and status controls
- Reusable UI components (cards, tables, dialogs, toasts, etc.)

## Tech stack

- React 18 + TypeScript
- Vite for build and dev server
- TailwindCSS (+ tailwind-merge)
- Radix UI primitives and Lucide icons
- Axios for HTTP requests
- @tanstack/react-query for data fetching
- Zod available for validation

## Quick start

1. Clone this repository.
2. Install dependencies:

```powershell
npm install
```

3. Create a `.env` file in the project root and set the API base URL:

```text
VITE_BACKEND_URL=https://api.example.com
```

4. Start the dev server:

```powershell
npm run dev
```

Open http://localhost:8080 in your browser (the Vite dev server is configured to use port 8080).

## Available scripts

- `npm run dev` — start Vite dev server
- `npm run build` — build production assets
- `npm run build:dev` — build with development mode
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint over the project

## Important configuration notes

- Environment variable: `VITE_BACKEND_URL` — the API client appends `/api` to this base URL.
- Aliased imports: `@` resolves to `src/` (see `vite.config.ts`).
- The API client lives in `src/api/api.js` and uses a request interceptor to inject a Bearer token from `localStorage`.
- Authentication and session state are handled by `src/contexts/AuthContext.tsx` (stores `token` and `user` in `localStorage`).

## Project structure (high level)

- src/
	- api/         — API client and endpoint functions
	- components/  — UI components and layout pieces
	- contexts/    — React contexts (Auth)
	- hooks/       — Custom hooks (toasts, mobile, etc.)
	- pages/       — Route pages (Index, NotFound, dashboard/*)
	- types/       — TypeScript types
	- lib/         — small utilities

## How to use

- Provision a backend user and roles via the backend API.
- Set `VITE_BACKEND_URL` to point to your backend.
- Sign in via the login page to access protected dashboard routes based on role.

## Tests

There are no unit or E2E tests included yet. Consider adding:

- Vitest + React Testing Library for component/unit tests
- Playwright or Cypress for end-to-end flows

## Recommended next steps

- Add CI (GitHub Actions) to run lint, typecheck, and build on push
- Add automated tests and coverage reporting
- Add CONTRIBUTING.md and a LICENSE file (MIT or Apache-2.0 are common choices)

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repository.
2. Create a feature branch.
3. Run lint and ensure types pass.
4. Open a pull request describing your changes.
