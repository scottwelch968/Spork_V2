# System Laws

## Purpose

Defines immutable system invariants enforced by database, RLS, and edge execution.

---

## Database Authority

All configuration is database-driven. Tables such as `system_settings`, `ai_models`, `cosmo_intents`, `cosmo_action_mappings`, `chat_functions`, `chat_actors`, `chat_containers` are authoritative.

## RLS as Firewall

RLS policies are security boundaries, not conveniences. Never bypass or duplicate RLS logic in client code.

## Server-Authoritative COSMO

Clients cannot write COSMO execution state. All orchestration decisions occur server-side.

## No Hard-Coded Variables

No hard-coded model IDs, providers, routing tiers, quotas, or integration logic. Environment variables allowed only for secrets.

## External Integrations

- OAuth, scopes, expiry, rate limits, and audit logging enforced by COSMO
- Credentials never exposed to client code

## Cost & Safety Enforcement

- Quota checks are **fail-closed**
- Agent loop limits are **mandatory**
- Webhooks require **signature verification**

## Auth Isolation

Admin/system auth is fully isolated from main app auth.
