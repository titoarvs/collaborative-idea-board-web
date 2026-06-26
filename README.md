# Collaborative Idea Board — Web

TanStack Start + Vite frontend for the Collaborative Idea Board. Talks to the
NestJS API (`../collaborative-idea-board-api`) over cookie-based JWT auth.

## Stack

- TanStack Start (Vite) + TanStack Router (file-based routes in `src/routes`)
- TanStack Query for server state, polling, and optimistic updates
- Tailwind CSS v4 + Base UI primitives
- `@dnd-kit` for the Kanban board

## Getting started

```bash
pnpm install
cp .env.example .env   # set VITE_API_URL (defaults to http://localhost:4000)
pnpm dev               # http://localhost:3000
```

Make sure the API is running first (`pnpm start:dev` in the api repo on port 4000).

## Scripts

- `pnpm dev` — start the dev server on port 3000
- `pnpm build` — production build (generates `src/routeTree.gen.ts`)
- `pnpm typecheck` — `tsc --noEmit`

## Features

- Email/password auth (sign in / sign up) backed by httpOnly access + refresh
  cookies. The API client auto-retries once on `401` via the refresh endpoint.
- Dashboard with team creation, invite-code join, and board cards
- Kanban board: drag-and-drop across columns, votes, comments, ticket panel
- Retro infinite canvas: sticky notes, text, shapes, frames, lines, stamps,
  pan/zoom, resize, reactions, and presence avatars

## Environment

| Variable       | Description                  | Default                 |
| -------------- | ---------------------------- | ----------------------- |
| `VITE_API_URL` | Base URL of the NestJS API   | `http://localhost:4000` |
