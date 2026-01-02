# Spork COSMO Functions (Reference Descriptions)
These are **reference implementations** from Spork that relate to COSMO control-plane concepts.
Use them as design hints, not production code.

## Supabase Edge Functions and Shared COSMO Modules
### `supabase/functions/_shared/cosmo/actionResolver.ts`
- Purpose: Resolves intent → action mapping.
- Exports: extractEntities, refreshActionMappingsCache

### `supabase/functions/_shared/cosmo/appProtocol.ts`
- Purpose: Unknown
- Exports: validateAppRequest, isOperationAllowed, hasRequiredPermissions, getRetryPolicy, getFailureHandler, isErrorRetryable, calculateBackoff, logAppRequest

### `supabase/functions/_shared/cosmo/batchManager.ts`
- Purpose: Batch/queue manager utilities for async execution.
- Exports: computeSimilarityHash, isBatchable, buildCombinedPrompt, extractResponses

### `supabase/functions/_shared/cosmo/contracts.ts`
- Purpose: Type/contract definitions for COSMO shared layer.
- Exports: n/a

### `supabase/functions/_shared/cosmo/errors.ts`
- Purpose: Typed error primitives for COSMO edge functions.
- Exports: createCosmoError, errorFromException, isCosmoError, errorToHttpStatus, isRetryable, getUserMessage, toExecutionError

### `supabase/functions/_shared/cosmo/externalIntegration.ts`
- Purpose: Unknown
- Exports: registerProvider, getProviderAdapter

### `supabase/functions/_shared/cosmo/functionExecutor.ts`
- Purpose: Executes selected COSMO functions/tools with governed I/O.
- Exports: n/a

### `supabase/functions/_shared/cosmo/functionSelector.ts`
- Purpose: Selects which function/tool to call based on intent/context.
- Exports: n/a

### `supabase/functions/_shared/cosmo/index.ts`
- Purpose: Unknown
- Exports: n/a

### `supabase/functions/_shared/cosmo/intentAnalyzer.ts`
- Purpose: Unknown
- Exports: requiresFunction, needsContext, refreshIntentCache

### `supabase/functions/_shared/cosmo/logger.ts`
- Purpose: Unknown
- Exports: log, debug, info, warn, error, logPhaseStart, logPhaseComplete, logRequest, logError, logException

### `supabase/functions/_shared/cosmo/modelRouter.ts`
- Purpose: Model routing helper (select model based on constraints/preferences).
- Exports: getCostTier, getCostTierLabel, selectModelByWeight

### `supabase/functions/_shared/cosmo/orchestrator.ts`
- Purpose: Orchestration entry logic (plan/build context/execute).
- Exports: corsHeaders

### `supabase/functions/_shared/cosmo/promptEnhancer.ts`
- Purpose: Unknown
- Exports: previewContextSources

### `supabase/functions/_shared/cosmo/providerConfig.ts`
- Purpose: Unknown
- Exports: getProviderEndpoint, getProviderApiKey, getProviderHeaders, isOpenRouterProvider, isLovableProvider

### `supabase/functions/_shared/cosmo/queueManager.ts`
- Purpose: Unknown
- Exports: calculatePriorityScore

### `supabase/functions/_shared/cosmo/responseProcessor.ts`
- Purpose: Unknown
- Exports: processResponse, createMetadataEvent, createActionsEvent, estimateTokens, calculateCost

### `supabase/functions/_shared/cosmo/types.ts`
- Purpose: Unknown
- Exports: n/a

### `supabase/functions/_shared/cosmo/webhookVerifier.ts`
- Purpose: Unknown
- Exports: detectWebhookProvider, getProviderSecret

### `supabase/functions/_shared/cosmoRouter.ts`
- Purpose: Routes COSMO requests to correct internal handler.
- Exports: getCostTier, getCostTierLabel, selectModelByWeight

### `supabase/functions/admin-data/index.ts`
- Purpose: Admin data aggregator endpoint for dashboards.
- Exports: n/a

### `supabase/functions/cosmo-agent/index.ts`
- Purpose: Unknown
- Exports: n/a

### `supabase/functions/cosmo-enqueue/index.ts`
- Purpose: Unknown
- Exports: n/a

### `supabase/functions/cosmo-queue-processor/index.ts`
- Purpose: Unknown
- Exports: n/a

### `supabase/functions/cosmo-task/index.ts`
- Purpose: Unknown
- Exports: n/a

### `supabase/functions/cosmo-webhook/index.ts`
- Purpose: Unknown
- Exports: n/a

### `supabase/functions/export-database/index.ts`
- Purpose: Exports database content (admin tooling).
- Exports: n/a

### `supabase/functions/sync-openrouter-models/index.ts`
- Purpose: Sync model catalog from OpenRouter into Spork model registry.
- Exports: n/a

