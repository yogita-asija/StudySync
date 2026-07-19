# StudySync

A full-stack study group platform built with Next.js (App Router), TypeScript, PostgreSQL, Prisma, Tailwind CSS, and Auth.js.

## Features implemented

- **Auth**: signup, login, logout (email + password via Auth.js Credentials provider)
- **Onboarding**: timezone + subjects + level, saved to the database
- **Study Groups**: create, list, search, filter (subject/mode), sort (recent/active), view detail, edit, delete
- **Membership**: join public groups instantly; request to join private groups; owner/co-host approve or reject requests; promote to co-host; remove members
- **Sessions**: schedule study sessions within a group, RSVP (going/maybe/not going)
- **Group chat**: simple message board per group (polls every 4s for new messages)
- **Notifications**: join requests, approvals, and new sessions generate notifications; view/mark as read

## 1. Prerequisites

- Node.js 20+
- A free [Neon](https://neon.tech) PostgreSQL database (or any Postgres instance)

## 2. Install dependencies

Because `next-auth@beta` hasn't updated its peer dependency range for Next.js 16 yet (this is a known upstream issue, the library works fine), install with:

```bash
npm install --legacy-peer-deps
```

## 3. Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
DATABASE_URL="your-neon-connection-string"
AUTH_SECRET="generate-with-npx-auth-secret"
```

Generate a secret automatically:

```bash
npx auth secret
```

(Use the **direct**, non-pooled connection string from Neon for `DATABASE_URL` — needed for migrations.)

## 4. Set up the database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

This creates all 12 tables (users, accounts, sessions, study_groups, subjects, memberships, join_requests, study_sessions, session_attendees, messages, notifications, etc.) in your database.

## 5. Run the app

```bash
npm run dev
```

Visit **http://localhost:3000**

## 6. Try the full flow

1. Sign up → log in → complete onboarding (pick timezone + subjects)
2. Go to **Browse Groups** → create a new group
3. Open the group → schedule a session → RSVP to it
4. Send a message in the group chat
5. Open the group in a second account (or incognito) → join it (or request to join, if private)
6. As the owner, go to **Manage** on the group page → approve/reject the request, promote/remove members
7. Check **Notifications** in the navbar

## Project structure

```
src/
├── app/
│   ├── api/                    # backend REST endpoints
│   │   ├── auth/[...nextauth]/
│   │   ├── signup/
│   │   ├── groups/
│   │   │   ├── route.ts        # GET (list+filters), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts    # GET, PATCH, DELETE
│   │   │       ├── join/
│   │   │       ├── leave/
│   │   │       ├── requests/
│   │   │       ├── members/[userId]/
│   │   │       ├── sessions/
│   │   │       └── messages/
│   │   ├── sessions/[id]/
│   │   │   ├── route.ts
│   │   │   └── rsvp/
│   │   └── notifications/
│   ├── login/, signup/, onboarding/, dashboard/
│   └── groups/
│       ├── page.tsx            # list + search/filter UI
│       ├── new/page.tsx        # create form
│       └── [id]/
│           ├── page.tsx        # detail: join, members, sessions, chat
│           └── manage/page.tsx # owner/co-host: requests, roles
├── lib/                        # prisma client, auth config, notification helper
├── components/                 # Navbar, SessionProvider wrapper
├── proxy.ts                     # route protection (Next.js 16 "proxy" convention)
└── types/next-auth.d.ts        # session type augmentation
```

## Common issues

**"MissingSecret" error** — `AUTH_SECRET` is missing or misnamed in `.env`. It must be exactly `AUTH_SECRET`, not `BETTER_AUTH_SECRET` or anything else.

**"Can't reach database server" (P1001)** — your Neon database may be idle; visiting the Neon dashboard usually wakes it. Also double check you copied the correct (direct, non-pooled) connection string.

**Route conflict errors** — never place a `page.tsx` inside any folder under `src/app/api/*`. That folder tree is backend-only.

**Prisma engine download errors during `npm install`** — this happens if your network blocks `binaries.prisma.sh`. Try again on a normal connection, or set `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` as an environment variable before running the command.


