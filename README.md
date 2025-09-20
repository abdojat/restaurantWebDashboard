# Borcella — Restaurant Management Dashboard (Web)

Professional, responsive admin dashboard for Borcella Restaurant. Built with Vite + React + TypeScript and TailwindCSS. It provides pages and components to manage users, roles, tables, reservations, categories, dishes, and orders. The app is structured for integration with a REST backend (API base URL configured via environment variable).

## Highlights

- Fast development with Vite and React (TypeScript)
- UI primitives and components adapted from shadcn/ui + Radix + Tailwind
- Role-based navigation and protected routes
- React Query for server-state and background fetching
- Axios-backed API client with token interceptor
- Rich management pages: Users, Roles, Tables, Reservations, Dishes, Orders, Categories

## Demo / Screens

- Landing / marketing page (Index)
- Login screen
- Dashboard home with stats and quick actions
- Full CRUD pages for Users, Tables, Categories, Dishes
- Reservation and Orders management with filters and status updates

## Tech stack

- Frontend: React 18, TypeScript, Vite
- Styling: TailwindCSS, tailwind-merge
- UI: shadcn styled primitives, Radix UI, Lucide icons
- Data: Axios, @tanstack/react-query
- Validation: Zod (present as a dependency)
- Utilities: date-fns, lodash-like helpers

## Repository scripts

All scripts assume npm. This project was scaffolded for Vite (see `vite.config.ts`).

- `npm run dev` — start Vite dev server (port 8080 by default)
- `npm run build` — build production assets
- `npm run build:dev` — build with development mode
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint over the project

## Environment variables

The app reads the backend base URL from an environment variable. Add a `.env` file at the project root with the following variable:

- `VITE_BACKEND_URL` — e.g. `https://api.example.com` (no trailing `/api`, the client appends `/api`)

Example .env (do not commit secrets):

VITE_BACKEND_URL=https://api.example.com

## Getting started (developer)

1. Clone the repository
2. Install dependencies

- Using npm
	- npm install

3. Create a `.env` file (see Environment variables above)
4. Start the dev server

- npm run dev

Open http://localhost:8080 in your browser (Vite is configured to use port 8080 in `vite.config.ts`).

## Building for production

1. Ensure your `.env` is set for the target backend
2. npm run build
3. npm run preview (optional) to test the production build locally

## Key implementation notes

- API client: `src/api/api.js` — axios instance with request interceptor that reads token from `localStorage` and sets `Authorization: Bearer <token>` header.
- Auth context: `src/contexts/AuthContext.tsx` — provides `user`, `login`, `logout`, and `isLoading`. On login the token and user are stored in localStorage.
- Routing & protection: `src/App.tsx` — ProtectedRoute component shows the `LoginForm` when not authenticated and renders dashboard routes when authenticated.
- Pages: `src/pages/dashboard/*` contain management UIs for users, roles, tables, reservations, categories, dishes and orders.
- UI components: `src/components/ui/*` provide reusable building blocks (buttons, cards, tables, dialogs, toasts, etc.).

## Environment & conventions

- Aliased imports: `@` resolves to `src/` (configured in `vite.config.ts`).
- Port: Vite dev server set to `8080` and host `::` to accept IPv6/localhost requests.

## Folder structure (top-level)

- src/
	- api/         => API client and endpoints
	- components/  => Reusable UI components and dashboard layout
	- contexts/    => React contexts (Auth)
	- hooks/       => Custom hooks (toasts, mobile, etc.)
	- pages/       => Route pages (Index, NotFound, dashboard/*)
	- types/       => TypeScript types for auth, table, etc.
	- lib/         => small utilities (eg. tailwind helpers)

## How to use the app (brief)

- Create a user with appropriate role via your backend admin API.
- Set `VITE_BACKEND_URL` to point at your backend.
- Open the app, login with the user credentials and navigate the dashboard.
- Role-based navigation limits what each user type can access (admin, manager, cashier).

## Tests

- There are minimal test scaffolding files (Create React App leftovers). No unit tests implemented. Consider adding unit and e2e tests (Vitest + React Testing Library; Playwright/Cypress for e2e).

## Recommended improvements / next steps

- Add CI pipeline (GitHub Actions) for lint, typecheck, and build previews
- Add environment-specific configurations for staging/production
- Add automated tests (unit + e2e) and coverage reporting
- Improve accessibility and add internationalization for labels (i18next already included)
- Add a CONTRIBUTING.md and CODE_OF_CONDUCT for clearer collaboration

## Contributing

Contributions are welcome. Recommended workflow:

1. Fork the repo
2. Create a feature branch
3. Run tests/lint and ensure types pass
4. Open a pull request describing your changes

## License

This project currently has no license file. Consider adding an open-source license (MIT, Apache-2.0) or a proprietary license depending on your plan.