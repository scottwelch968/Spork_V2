# COSMO-Native Admin Reuse Matrix (Spork Reference)
Legend: ✅ reusable as-is pattern • ⚠️ reusable with constraints • ❌ do not ship in that version
| Surface | v0 | v1 | v2 | Rationale |
|---|---|---|---|---|
| /admin/models (AdminModels page) | ⚠️ Read-only inspection only | ✅ Admin control plane | ✅ Enterprise control plane | v0 forbids dashboards; v1 allows admin-only inspection/config; v2 expands. |
| ModelsList + ModelForm | ⚠️ Read-only list only | ✅ CRUD + enable/disable | ✅ CRUD + scoping + audit | Durable config affects routing/cost; keep governed. |
| FallbackModelsList + FallbackModelForm | ⚠️ Static fallback chain only | ✅ Fallback chain editor | ✅ Multi-tier fallback + policy | v0 should keep routing simple; v1 supports dynamic routing. |
| ModelConfigTab (default model selectors) | ❌ | ✅ | ✅ | UI for config is v1+; v0 config should be code/env. |
| PreMessageConfigTab (context injection toggles) | ❌ | ✅ | ✅ | Impacts determinism/context; v1+ with logging. |
| AiFunctionsTab (model↔function bindings) | ❌ | ⚠️ | ✅ | Depends on tool registry maturity; v1 limited, v2 full. |
| /admin/cosmo (AdminCosmo page) | ⚠️ Inspection only | ✅ Admin inspection + controls | ✅ Operator/auditor views | v0: minimal inspection; v1: admin-only UI allowed; v2: full. |
| CosmoDebugTab | ✅ | ✅ | ✅ | Debug/replay/trace is core. |
| CosmoCostsTab | ✅ Read-only | ✅ | ✅ | Cost visibility is core feature. |
| CosmoHealthTab | ⚠️ Read-only | ✅ | ✅ | Operational status OK; control knobs later. |
| CosmoQueueTab | ❌ | ⚠️ | ✅ | Queue implies async/retry policies; v1+ if needed. |
| CosmoIntentsTab | ❌ | ✅ | ✅ | Intent registry is routing config; v1+. |
| CosmoActionMappingsTab | ❌ | ✅ | ✅ | Routing/action mapping DSL is v1+. |
| CosmoFunctionChainsTab | ❌ | ✅ | ✅ | Workflow composition/versioning is v1+. |
| CosmoConfigurationTab | ❌ | ✅ | ✅ | Config-heavy; avoid in v0. |
| CosmoTestingTab | ❌ | ⚠️ | ✅ | UI-driven testing risks; v1 limited, v2 full. |
| CosmoOverviewTab | ❌ | ⚠️ | ✅ | Dashboard is v1+ (admin-only). |

Notes:
- v0: keep UI **inspection-only**; config should be env/code.
- v1: admin-only control plane is allowed.
- v2: enterprise operator/auditor controls.
