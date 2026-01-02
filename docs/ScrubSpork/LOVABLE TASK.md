## **Lovable guide: Strip Spork into a presentation layer \+ migrate COSMO to COSMO 2.0 API calls**

Copy/paste this into Lovable as your single instruction block.

---

# **LOVABLE TASK: “Spork → Presentation Layer Only (COSMO 2.0 API Client)”**

## **Objective**

Refactor Spork so it becomes a **thin presentation layer** (Spork UI/UX only). All COSMO behavior must move behind **COSMO 2.0 APIs**. Spork must not contain orchestration logic, routing logic, tool execution logic, model management logic, or “COSMO state machines” beyond basic UI state.

Spork becomes:

* UI routes \+ components  
* forms \+ validation  
* display of logs/status/results  
* calling COSMO 2.0 APIs

COSMO becomes:

* orchestration \+ planning/execution split  
* routing/models/tools/agents/compliance  
* persistent state \+ audit logs

## **Non-goals**

Do NOT implement COSMO 2.0 backend inside Spork.  
Do NOT rebuild permissions/auth/RBAC in this pass.  
Do NOT keep old Supabase Edge Functions as “COSMO logic.”

---

## **Hard Rules (No Exceptions)**

1. **No direct model calls in Spork** (OpenAI/OpenRouter/Anthropic/etc) except via COSMO 2.0 API.  
2. **No tool execution in Spork** (Slack/Gmail/etc) except via COSMO 2.0 API.  
3. **No routing logic in Spork** (no “pick model”, “fallback selection”, “intent to action mapping” logic beyond UI selection fields).  
4. **No durable COSMO state in Spork DB** unless it’s purely UI preferences. COSMO-owned state lives in COSMO DB.

---

## **Target Architecture (Client → API)**

Spork should call COSMO via a single client module:

### **Create: `src/cosmo2/client.ts`**

Provide a typed API client wrapper:

* `cosmo2.request()` (primary execution endpoint)  
* `cosmo2.getModels()` (admin catalog display)  
* `cosmo2.updateModel()` (admin writes)  
* `cosmo2.getRoutingConfig()` / `updateRoutingConfig()`  
* `cosmo2.getIntents()` / `updateIntent()`  
* `cosmo2.getActionMappings()` / `updateActionMapping()`  
* `cosmo2.getFunctionChains()` / `updateFunctionChain()`  
* `cosmo2.getCosts()` / `getHealth()` / `getQueue()` / `getLogs()`

All of these map to HTTP calls, with:

* base URL from env: `VITE_COSMO2_API_BASE_URL`  
* auth header passthrough (bearer) but do not build auth logic here

---

## **What to Strip (Delete or Disable)**

### **1\) Remove COSMO backend logic from Spork**

Delete/disable Spork COSMO logic sources, especially:

* `supabase/functions/_shared/cosmo/**`  
* `supabase/functions/sync-openrouter-models/**`  
* `supabase/functions/admin-data/**` (if it’s aggregating COSMO internals)  
* any file containing “orchestrator”, “modelRouter”, “functionExecutor”, “actionResolver”, “batchManager” that implements orchestration

Replace with:

* API calls to COSMO 2.0

### **2\) Remove COSMO DB ownership from Spork migrations**

Stop Spork from “owning” COSMO control-plane tables. In Spork DB keep only:

* UI preferences (theme, table filters, last selected workspace)  
* caching if needed (optional, short-lived, not source of truth)

Everything else becomes read/write via COSMO API.

### **3\) Remove COSMO “services” inside UI**

Search and eliminate:

* `useCosmo*` hooks that fetch from Spork DB/edge functions  
* utilities that compute routing decisions, fallback chains, action mappings, function chain execution

Replace with:

* hooks that call `src/cosmo2/client.ts`

---

## **What to Keep (UI value)**

Keep all admin pages/forms as UI blueprints, but rewire data flow:

* `/admin/models` UI remains, but:  
  * list models from `GET /models`  
  * edit model via `PUT /models/:id`  
  * fallback chains via `PUT /routing/fallbacks`  
* `/admin/cosmo` control plane remains, but:  
  * “Costs” calls `GET /metrics/costs`  
  * “Health” calls `GET /health`  
  * “Queue” calls `GET /queue` and `POST /queue/retry` (if exposed)  
  * “Intents” calls `GET/PUT /intents`  
  * “Action mappings” calls `GET/PUT /action-mappings`  
  * “Function chains” calls `GET/PUT /function-chains`  
  * “Debug” calls `GET /logs` \+ `POST /replay` (if COSMO supports)  
  * “Testing” calls `POST /simulate` or `POST /dry-run` (if COSMO supports)

Spork should never “decide” outcomes. It only displays and sends requests.

---

## **Execution Steps (Do in order)**

### **Step A — Inventory \+ report (output required)**

Produce a markdown report listing:

* all files removed/disabled  
* all files changed  
* the new COSMO 2.0 client surface (methods \+ endpoints)  
* which routes/pages were rewired

### **Step B — Add COSMO 2.0 API client**

Implement `src/cosmo2/client.ts` \+ `src/cosmo2/types.ts`.

### **Step C — Rewire AdminModels \+ AdminCosmo**

For each page/tab:

* replace Supabase/edge-function calls with cosmo2 client calls  
* preserve UI behavior, forms, validation, optimistic UI if exists  
* errors should show as toast/banner, but error classification comes from API

### **Step D — Remove old COSMO edge function dependencies**

Replace imports, delete functions, and remove any build references.

### **Step E — Minimal DB cleanup**

* keep only UI preference tables  
* remove / ignore COSMO tables/migrations that conflict with COSMO 2.0 ownership  
* ensure app still boots and admin pages still render

---

## **Acceptance Criteria**

1. Spork builds and runs with COSMO removed locally (no internal orchestrator required).  
2. All COSMO admin pages load data exclusively from COSMO 2.0 API.  
3. No direct OpenRouter/OpenAI calls exist in Spork.  
4. No tool execution exists in Spork.  
5. Spork DB contains no durable COSMO control-plane config (models, routing, intents, mappings, chains).  
6. A single integration point exists: `src/cosmo2/client.ts`.

---

## **Deliverables**

* PR-ready code changes  
* `docs/STRIP_PLAN.md` (what removed, why)  
* `docs/COSMO2_API_MAPPING.md` (UI screen → API endpoints)  
* `src/cosmo2/client.ts` and `src/cosmo2/types.ts`

---

## **Endpoint placeholders (use these names even if backend isn’t ready)**

Use a consistent REST shape:

* `POST /v2/execute`  
* `GET /v2/models`  
* `PUT /v2/models/:modelId`  
* `GET /v2/routing/config`  
* `PUT /v2/routing/config`  
* `GET /v2/intents`  
* `PUT /v2/intents/:intentKey`  
* `GET /v2/action-mappings`  
* `PUT /v2/action-mappings/:mappingId`  
* `GET /v2/function-chains`  
* `PUT /v2/function-chains/:chainKey`  
* `GET /v2/metrics/costs`  
* `GET /v2/health`  
* `GET /v2/queue`  
* `GET /v2/logs`  
* `POST /v2/replay`  
* `POST /v2/dry-run`

If a backend endpoint doesn’t exist yet, stub the client method and keep the UI wired to it.

---

## **“Don’t get clever” warning**

If you’re tempted to keep logic in Spork because it’s “already working,” stop. The goal is architectural separation: **Spork \= UI client; COSMO \= OS**.

---

