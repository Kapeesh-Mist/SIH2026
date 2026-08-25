# FinTrack

A hierarchical budget & expense tracking platform: an admin creates a scheme
and its budget, adds intermediates below them, intermediates add end users
below them, and every rupee spent by an end user has to be verified before
it counts — so the whole chain from top-level budget to the last worker is
visible and auditable.

```
fintrack/
├── frontend/     Static HTML/CSS/JS — one file per page, no build step
└── backend/      Node.js + Express API — auth, schemes, users, uploads
```

## Quick start

**1. Backend**
```bash
cd backend
npm install
cp .env.example .env      # then edit ADMIN_EMAIL / ADMIN_PASSWORD / JWT_SECRET
npm start                 # http://localhost:4000
```
The first time it runs against an empty database, it seeds one admin
account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`. That's the account
you log in with to create your first scheme and start adding people below
you — there's no public sign-up, matching how the hierarchy is meant to
grow (admin → intermediate → end user, each added by the tier above them).

**2. Frontend**

The frontend is plain HTML/CSS/JS, so you can just open `frontend/index.html`
in a browser, or serve the folder with any static server, e.g.:
```bash
cd frontend
npx serve .                # or: python3 -m http.server 5500
```
It talks to the backend at `http://localhost:4000/api` by default. To
point it somewhere else, add this before the other scripts on any page:
```html
<script>window.FINTRACK_API_BASE = 'https://your-api.example.com/api';</script>
```

## Pages (each is its own file, ready to wire to the backend independently)

| File | Who sees it | What it does |
|---|---|---|
| `index.html` | Everyone | Marketing home page — problem, how the hierarchy works, roles, login/entry point |
| `login.html` | Everyone | Email + password; redirects by the role the backend returns |
| `admin-dashboard.html` | Admin | Overview stats, Create-scheme button, Ongoing/Completed scheme list |
| `admin-create-scheme.html` | Admin | Name, initial budget, optional PDF, Cancel/Create |
| `admin-scheme-view.html` | Admin | Users + Add user (role: intermediate/end user), Progress & Expenditure columns |
| `intermediate-dashboard.html` | Intermediate | Same as admin overview, minus Create |
| `intermediate-scheme-view.html` | Intermediate | Users + Add user (end users only), "To be verified" queue, Progress & Expenditure |
| `enduser-dashboard.html` | End user | Their assigned project(s), Ongoing/Completed |
| `enduser-scheme-view.html` | End user | Their project — upload Progress and Expenditure PDFs, see verification status |

## How the roles differ

- **Admin** — creates schemes and sets the budget; adds intermediates (or
  end users directly); can see every scheme, since they're the central
  point of oversight.
- **Intermediate** — adds end users under them for a scheme; nothing an
  end user uploads counts until an intermediate clicks **Verify** — until
  then it only shows in the "to be verified" queue, not in Progress or
  Expenditure.
- **End user** — sees their project, uploads progress and expenditure
  proof (PDFs), and can see whether each upload is still awaiting
  verification or has been confirmed.

## Assumptions worth knowing about

Your original brief was a long voice note, so a few points weren't fully
spelled out — here's what I assumed, and where to change it if it's wrong:

- **No public sign-up.** Since users are always added by the tier above
  them, the "Sign up" link on the landing page explains that and points
  people to their admin, rather than opening a self-serve registration
  form. If you *do* want open registration for the first admin, that's a
  small addition to `routes/auth.js`.
- **Intermediates can only add end users**, not other intermediates —
  that's what keeps the tree the shape you described (admin →
  intermediate → end user). If an intermediate should be able to add
  another intermediate, relax the `allowedRoles` check in
  `backend/routes/users.js`.
- **Risk flag** is a placeholder heuristic (verified spend as a % of
  budget) in `runFlagCheck()` in `backend/routes/schemes.js` — swap it
  for a real anomaly-detection model without touching any route or the
  frontend, since the frontend only reads `scheme.risk`.
- **Storage** is a flat JSON file (`backend/db.js`) so the whole thing
  runs with zero external setup. Swap it for Postgres/MySQL by
  reimplementing `load()`/`save()` — no route code needs to change.
- **PDF uploads** are stored on disk under `backend/data/uploads` and
  served at `/uploads/<filename>`. Add virus scanning / cloud storage
  there before this goes anywhere near production data.

## Security note before this goes near real budgets

This is a working scaffold, not a hardened production system. Before using
it for real government or institutional money: put it behind HTTPS, move
off the JSON-file database, add rate limiting on `/api/auth/login`, add
audit logging (who verified what, when), and get a real security review —
especially given the stated use case (government budgets, anti-leakage).
