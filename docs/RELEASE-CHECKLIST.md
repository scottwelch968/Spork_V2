# Spork — Release Captain Checklist

> **Last Updated:** December 2024  
> **Role:** Staff Engineer / Release Captain  
> **Authority:** Can delay launch unilaterally  
> **Applies to:** Any production release (initial or major)

---

## Table of Contents

1. [Pre-Release Gate (GO/NO-GO)](#1-pre-release-gate-gono-go)
   - [1.1 Tenancy & Security](#11-tenancy--security)
   - [1.2 Orchestration Safety (COSMO)](#12-orchestration-safety-cosmo)
   - [1.3 Core Feature Surface](#13-core-feature-surface)
2. [Operational Readiness](#2-operational-readiness)
   - [2.1 Observability](#21-observability)
   - [2.2 Billing & Usage](#22-billing--usage)
3. [Product Surface Control](#3-product-surface-control)
4. [Deployment & Environment](#4-deployment--environment)
5. [Incident Readiness](#5-incident-readiness)
6. [Final Release Sign-Off](#6-final-release-sign-off)
7. [Post-Release Verification (Day 0-2)](#7-post-release-verification-day-0-2)
8. [Release Captain Authority Statement](#release-captain-authority-statement)

---

## 1. Pre-Release Gate (GO/NO-GO)

### 1.1 Tenancy & Security

> **⛔ NO-GO if any item is unchecked**

- [ ] Every workspace-scoped table has an explicit RLS policy
- [ ] RLS policies tested against:
  - [ ] Cross-workspace access (user A cannot access workspace B data)
  - [ ] Removed member access (removed users lose access immediately)
  - [ ] Role downgrade behavior (downgraded permissions apply immediately)
- [ ] No frontend-only authorization logic (all auth enforced server-side)
- [ ] Admin routes require:
  - [ ] System role validation
  - [ ] Separate session validation (SystemAuthContext)
- [ ] No secrets exposed to client bundles (check `VITE_` prefix usage)
- [ ] OAuth tokens stored server-side only (Supabase Vault)

### 1.2 Orchestration Safety (COSMO)

> **⛔ NO-GO if any item is unchecked**

- [ ] Max orchestration depth enforced (`AGENT_MAX_ITERATIONS = 10`)
- [ ] Max tool invocations enforced per request
- [ ] Token usage hard cap enforced via `check-quota` edge function
- [ ] Execution timeouts at each orchestration step
- [ ] Explicit execution states implemented (pending → processing → completed/failed)
- [ ] No infinite retry paths (all retries have max count)
- [ ] Failures terminate execution deterministically (no silent failures)

### 1.3 Core Feature Surface

> **⛔ NO-GO if any item is unchecked**

- [ ] All routes reachable and tested:
  - [ ] `/auth` - Authentication flow
  - [ ] `/dashboard` - Main dashboard
  - [ ] `/chat` - Chat interface
  - [ ] `/discover` - Persona templates
  - [ ] `/prompts` - Personal prompts
  - [ ] `/personas` - Personal personas
  - [ ] `/images` - Generated images
  - [ ] `/videos` - Generated videos
  - [ ] `/files` - File management
  - [ ] `/settings` - User settings
  - [ ] `/workspace/*` - Workspace routes
  - [ ] `/cosmo/*` - Admin routes
- [ ] Chat send → receive flows working for all model providers
- [ ] File upload/download tested (size limits enforced)
- [ ] Image generation working with configured model
- [ ] Knowledge base query returning results with citations

---

## 2. Operational Readiness

### 2.1 Observability

> **⚠️ Strongly recommended before launch**

- [ ] Error logging captures structured errors with:
  - [ ] HTTP status codes
  - [ ] PostgreSQL error codes
  - [ ] User-friendly messages via `useErrorTranslation`
- [ ] `cosmo_debug_logs` capturing all routing decisions
- [ ] Activity logging (`activity_log`) tracking user actions
- [ ] Console errors monitored (no unhandled Promise rejections)
- [ ] Edge function logs accessible via Supabase dashboard

### 2.2 Billing & Usage

> **⚠️ Strongly recommended before launch**

- [ ] `check-quota` enforcing limits before AI operations
- [ ] Usage events logged to `usage_logs` with accurate token counts
- [ ] Subscription tiers configured with correct quotas
- [ ] Overage behavior defined (block vs. degrade gracefully)
- [ ] Cost tracking dashboard showing accurate metrics

---

## 3. Product Surface Control

> **Scope control for initial launch**

- [ ] Feature flags configured for unreleased features:
  - [ ] `app_store_enabled` - Controls integrations visibility
  - [ ] `video_generation_enabled` - Controls video generation access
  - [ ] Advanced features hidden behind system settings
- [ ] "Coming Soon" indicators on incomplete features
- [ ] Beta labels on experimental features
- [ ] No broken links or 404 pages in navigation

---

## 4. Deployment & Environment

- [ ] Environment variables configured:
  - [ ] `OPENROUTER_API_KEY` - AI model access
  - [ ] `LOVABLE_AI_GATEWAY_URL` - Fallback AI gateway
  - [ ] Email provider credentials (Resend/SendGrid)
  - [ ] OAuth client secrets (Google, etc.)
- [ ] Edge functions deployed and responding
- [ ] Database migrations applied successfully
- [ ] RLS policies active (verified via Supabase dashboard)
- [ ] Storage buckets configured with correct policies:
  - [ ] `app-media` - Public read for generated content
  - [ ] `knowledge-base` - Authenticated access only
  - [ ] `user-files` - User-scoped access
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate valid

---

## 5. Incident Readiness

- [ ] Rollback procedure documented:
  1. Identify breaking change
  2. Revert to previous deployment via Lovable
  3. Verify rollback successful
  4. Communicate to affected users
- [ ] Kill-switches available:
  - [ ] `app_store_enabled = false` - Disable integrations
  - [ ] Model fallback chain configured
  - [ ] Rate limiting thresholds set
- [ ] On-call contact list current
- [ ] Status page or communication channel ready
- [ ] User-facing error messages tested (no technical jargon)

---

## 6. Final Release Sign-Off

### Stakeholder Approval

| Role | Name | Approved | Date |
|------|------|----------|------|
| Release Captain | __________ | ☐ | __________ |
| Product Owner | __________ | ☐ | __________ |
| Engineering Lead | __________ | ☐ | __________ |

### Pre-Launch Verification

- [ ] All NO-GO items in Section 1 are checked
- [ ] Critical bugs triaged and resolved or accepted
- [ ] Performance baseline established (load time < 3s)
- [ ] Mobile responsiveness verified
- [ ] Accessibility basics checked (keyboard nav, contrast)

### Launch Decision

> **GO / NO-GO Decision:** __________  
> **Decision Date:** __________  
> **Notes:** __________

---

## 7. Post-Release Verification (Day 0-2)

### Day 0 (Launch Day)

- [ ] Monitor error rates in `cosmo_debug_logs`
- [ ] Verify new user signups completing successfully
- [ ] Check chat flows working across model providers
- [ ] Monitor quota enforcement (no unexpected blocks)
- [ ] Track response times (< 5s for chat responses)

### Day 1

- [ ] Review overnight error logs
- [ ] Check billing accuracy (usage matches expected)
- [ ] Verify email delivery (welcome emails, notifications)
- [ ] Monitor user feedback channels
- [ ] Address any P0/P1 issues immediately

### Day 2

- [ ] Full system health check
- [ ] Usage analytics review
- [ ] User feedback synthesis
- [ ] Document any issues encountered
- [ ] Plan hotfix releases if needed

---

## Release Captain Authority Statement

| Authority | Description |
|-----------|-------------|
| **Stop Launch** | Can unilaterally delay any release if safety items are unchecked |
| **Rollback** | Can initiate rollback without additional approval |
| **Safety Non-Negotiable** | Does not compromise on NO-GO items under any pressure |
| **Escalation** | Escalates unresolved blockers to leadership immediately |

> **"Shipping fast is optional. Shipping safely is not."**

---

## Quick Reference

### NO-GO Categories (Must all pass)

1. ⛔ Tenancy & Security
2. ⛔ Orchestration Safety (COSMO)
3. ⛔ Core Feature Surface

### Key Files to Verify

| Component | File Location |
|-----------|---------------|
| Auth Context | `src/contexts/AuthContext.tsx` |
| System Auth | `src/contexts/SystemAuthContext.tsx` |
| COSMO Orchestrator | `supabase/functions/_shared/cosmo/orchestrator.ts` |
| Quota Check | `supabase/functions/check-quota/index.ts` |
| Error Translation | `src/hooks/useErrorTranslation.ts` |
| RLS Policies | Supabase Dashboard → Database → Policies |

### Emergency Contacts

| Role | Contact |
|------|---------|
| Release Captain | TBD |
| On-Call Engineer | TBD |
| Product Owner | TBD |

---

*This checklist is a living document. Update as the system evolves.*
