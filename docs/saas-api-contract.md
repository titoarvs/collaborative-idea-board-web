# SaaS API Contract (Organizations, Billing, Admin)

This document specifies the backend (NestJS) endpoints the frontend depends on for
multi-tenancy and subscriptions. The frontend gates UI optimistically, but **the
backend is the source of truth** and must enforce every limit server-side.

All endpoints use cookie-based auth (`credentials: include`) and return JSON.

## Concepts

- **Organization** = tenant. Owns boards (teams), members, and one subscription.
- **Board** = the existing `team` entity, now scoped to an organization.
- **Plans**: `free` (1 board, no retro, 30-day trial) and `pro` (10 boards, retro enabled).
- **Org roles**: `owner | admin | member`. **Platform role**: `system_admin | user`.

## Plan limits (must be enforced server-side)

| Plan | Boards | Retro | Trial |
| ---- | ------ | ----- | ----- |
| free | 1      | no    | 30 days |
| pro  | 10     | yes   | n/a   |

## Standard plan-limit error shape

When an action is blocked by the plan, respond with an HTTP status and a machine
readable `code` the frontend maps to an upgrade prompt:

```json
{ "statusCode": 402, "code": "BOARD_LIMIT", "message": "Free plan allows 1 board." }
```

| Code            | When                                             | Suggested status |
| --------------- | ------------------------------------------------ | ---------------- |
| `BOARD_LIMIT`   | Creating a board beyond the plan limit           | 402              |
| `PLAN_REQUIRED` | Accessing a Pro-only feature (retro) on Free     | 403              |
| `TRIAL_EXPIRED` | Any write on a Free org whose trial has lapsed   | 402              |

## Auth

### `GET /auth/me`

Add a platform `role` to the existing payload.

```json
{ "user": { "id": "u_1", "name": "Ada", "email": "ada@x.com", "image": null, "role": "user" } }
```

`role` is `"system_admin"` or `"user"` (absent treated as `user`).

## Organizations

### `GET /organizations`

Organizations the current user belongs to. `role` is the caller's role in each.

```json
[
  {
    "id": 1, "name": "Acme", "plan": "free", "status": "trialing",
    "trialEndsAt": "2026-07-26T00:00:00.000Z", "boardCount": 1, "role": "owner",
    "createdAt": "2026-06-26T00:00:00.000Z", "updatedAt": "2026-06-26T00:00:00.000Z"
  }
]
```

`status`: `trialing | active | past_due | canceled | expired`.

### `POST /organizations`

Body `{ "name": string }`. Creates an org with the caller as `owner`, starts a
30-day trial (`status: "trialing"`, `trialEndsAt` = now + 30d, `plan: "free"`).
Returns the `Organization`.

### `GET /organizations/:id`

Single `Organization` (must be a member). 404/403 otherwise.

### `PATCH /organizations/:id`

Body `{ "name"?: string }`. Owner/admin only.

## Boards (org-scoped teams)

### `GET /organizations/:id/teams`

Boards in the org (same `Team` shape, now including `organizationId`).

### `POST /organizations/:id/teams`

Body `{ "name": string, "description"?: string }`. Returns the created `Team`.
**Enforce board limit**: if `boardCount >= limit`, return `402 { code: "BOARD_LIMIT" }`.
If the org's trial has expired, return `402 { code: "TRIAL_EXPIRED" }`.

Existing per-team endpoints remain (`GET /teams/:id`, `/teams/:id/members`,
`/teams/:id/ideas`, `/teams/join`, etc.) but must verify the caller's org access.

### Retro gating

All retro/canvas endpoints (`/teams/:id/canvas/*`) must return
`403 { code: "PLAN_REQUIRED" }` when the owning org is not on `pro`.

## Org members and invites

### `GET /organizations/:id/members`

```json
[{ "userId": "u_1", "name": "Ada", "email": "ada@x.com", "image": null, "role": "owner" }]
```

### `POST /organizations/:id/invites`

Body `{ "email": string, "role": "admin" | "member" }`. Owner/admin only.
Sends/creates an invite. Returns `201`.

### `PATCH /organizations/:id/members/:userId/role`

Body `{ "role": "admin" | "member" }`. Owner/admin only. Cannot change the owner.

### `DELETE /organizations/:id/members/:userId`

Owner/admin only. Cannot remove the owner.

## Billing (provider-agnostic: PayMongo or Stripe)

### `GET /organizations/:id/subscription`

```json
{
  "plan": "pro", "status": "active",
  "trialEndsAt": null, "currentPeriodEnd": "2026-07-26T00:00:00.000Z",
  "cancelAtPeriodEnd": false
}
```

### `POST /billing/checkout`

Body `{ "organizationId": number, "plan": "pro" }`. Creates a hosted checkout
session with the provider and returns its URL. The frontend redirects to it.

```json
{ "url": "https://checkout.provider.com/session/abc" }
```

Configure success/cancel return URLs back to `"<frontend>/billing?status=success"`
and `"?status=cancel"`.

### `POST /billing/portal`

Body `{ "organizationId": number }`. Returns `{ "url": string }` for the provider's
customer portal (manage/cancel). Owner/admin only.

### `POST /billing/webhook`

Provider -> backend (no frontend involvement). Verify the signature, then update
the org's `plan`/`status`/`currentPeriodEnd`/`cancelAtPeriodEnd` on
`checkout.completed`, `subscription.updated`, `subscription.deleted`, etc.

## Admin (system_admin only)

Guard all of these with the platform `system_admin` role.

### `GET /admin/organizations`

```json
[
  {
    "id": 1, "name": "Acme", "plan": "free", "status": "trialing",
    "trialEndsAt": "2026-07-26T00:00:00.000Z", "boardCount": 1,
    "memberCount": 3, "ownerEmail": "ada@x.com", "createdAt": "2026-06-26T00:00:00.000Z"
  }
]
```

### `PATCH /admin/organizations/:id/plan`

Body `{ "plan": "free" | "pro" }`. Manually overrides the plan (e.g. comping an org).

### `PATCH /admin/organizations/:id/trial`

Body `{ "days": number }`. Extends `trialEndsAt` by `days` (and sets
`status: "trialing"` if appropriate).

### `GET /admin/billing-settings`

Returns the active provider plus a **secret-free** view. Secrets are reported as
booleans only; their plaintext is never returned.

```json
{
  "activeProvider": "stripe",
  "encryptionConfigured": true,
  "stripe": { "pricePro": "price_123", "secretKeySet": true, "webhookSecretSet": false },
  "paymongo": { "proAmount": 60000, "secretKeySet": false, "webhookSecretSet": false },
  "updatedAt": "2026-06-26T00:00:00.000Z",
  "updatedBy": "user-id"
}
```

### `PUT /admin/billing-settings`

Sets the active provider and stores provider keys. Secrets are encrypted at rest
(AES-256-GCM, keyed by server env `BILLING_ENCRYPTION_KEY`). Secret fields are
**only** updated when a non-empty value is sent; omit them to keep the existing
value. Returns the same shape as `GET`.

```json
{
  "activeProvider": "stripe" | "paymongo" | "dev" | "none",
  "stripeSecretKey"?: string,
  "stripePricePro"?: string,
  "stripeWebhookSecret"?: string,
  "paymongoSecretKey"?: string,
  "paymongoProAmount"?: number,
  "paymongoWebhookSecret"?: string
}
```

DB-stored settings take precedence over the corresponding env vars; if a key is
unset in the DB the server falls back to the env var. Returns `400` if secrets
are submitted while `BILLING_ENCRYPTION_KEY` is not configured.

## Notes for implementers

- Tenant isolation: every org-scoped query must filter by membership; never trust
  client-supplied org/board ids without an authorization check.
- Trial expiry should be evaluated server-side from `trialEndsAt`; do not rely on
  the client's clock.
- Keep the `code` field stable; the frontend switches on the exact values above.
