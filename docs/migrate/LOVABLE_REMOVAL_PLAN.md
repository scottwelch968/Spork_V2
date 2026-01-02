# Lovable Removal Plan

Complete plan to remove all Lovable-related UI, code, and dependencies from the codebase.

## Phase 1: Dependencies & Build Configuration

### 1.1 Package Dependencies
- [ ] **File:** `package.json`
  - Remove `lovable-tagger` from `devDependencies`
  - Verify no other Lovable packages exist

### 1.2 Vite Configuration
- [ ] **File:** `vite.config.ts`
  - Remove `import { componentTagger } from "lovable-tagger";`
  - Remove commented `componentTagger()` from plugins array
  - Clean up any Lovable-specific build configurations

## Phase 2: Core Code References

### 2.1 Supabase Client Fallbacks
- [ ] **File:** `src/hooks/useExternalSupabase.tsx`
  - Remove `import { supabase as lovableSupabase }`
  - Update `createExternalSupabaseClient()` to throw error if no config provided (no fallback)
  - Update `useExternalSupabase()` to require config (no Lovable Cloud fallback)
  - Update comments: Remove "Lovable's client" and "Lovable Cloud" references
  - **Action:** Make external Supabase configuration required, not optional

### 2.2 Provider Configuration
- [ ] **File:** `supabase/functions/_shared/cosmo/providerConfig.ts`
  - Remove `'lovable ai'` and `'lovable'` from `PROVIDER_ENDPOINTS`
  - Remove `LOVABLE_API_KEY` from `getProviderApiKey()`
  - Update `getProviderEndpoint()` to default to OpenRouter instead of Lovable
  - Remove or update `isLovableProvider()` function
  - **Decision needed:** Should we remove this function entirely or repurpose it?

### 2.3 Edge Functions
- [ ] **Search:** All edge functions for `LOVABLE_API_KEY` usage
  - Replace with `OPENROUTER_API_KEY` or direct OpenAI API
  - Update error messages and fallback logic
  - **Files to check:**
    - `supabase/functions/chat/index.ts`
    - `supabase/functions/generate-image/index.ts`
    - `supabase/functions/query-knowledge-base/index.ts`
    - Any other functions using Lovable API

## Phase 3: UI & User-Facing Text

### 3.1 Settings/Configuration UI
- [ ] **Search:** All components with "Lovable" in text
  - Remove Lovable branding from UI
  - Update help text and tooltips
  - Remove Lovable-specific configuration options
  - **Files to check:**
    - Settings components
    - Configuration dialogs
    - Admin panels
    - Onboarding/tutorial content

### 3.2 Documentation References
- [ ] **Files in `docs/`:**
  - `docs/lovable-ai-methodology.md` - Archive or remove
  - `docs/governance/05-LOVABLE-ENTERPRISE-MODE.md` - Review and update
  - `docs/ScrubSpork/LOVABLE TASK.md` - Archive (task completed)
  - `docs/migrate/MIGRATION_GUIDE.md` - Remove Lovable references
  - `src/docs/SECRETS.md` - Remove `LOVABLE_API_KEY` references
  - Update all migration guides to remove Lovable steps

### 3.3 Error Messages & Logs
- [ ] **Search:** All error messages mentioning Lovable
  - Update to generic "AI provider" or specific provider name
  - Remove Lovable-specific error handling

## Phase 4: Environment Variables & Secrets

### 4.1 Environment Configuration
- [ ] **File:** `.env.example` (if exists)
  - Remove `LOVABLE_API_KEY` from examples
- [ ] **File:** `src/docs/SECRETS.md`
  - Remove `LOVABLE_API_KEY` from required/optional secrets
  - Update documentation to reflect OpenRouter as primary provider

### 4.2 Edge Function Secrets
- [ ] **Supabase Dashboard:** Edge Functions Secrets
  - Document removal of `LOVABLE_API_KEY` secret
  - Update deployment scripts to not require this secret
  - **File:** `docs/migrate/deploy-edge-functions.sh`
    - Remove `LOVABLE_API_KEY` from `OPTIONAL_SECRETS` array

## Phase 5: Database & Data

### 5.1 Database Schema
- [ ] **Check:** Database tables for Lovable references
  - Review `ai_providers` or similar tables
  - Remove or update Lovable provider entries
  - Update default provider settings

### 5.2 Seed Data
- [ ] **File:** `docs/migrate/seed-system-data.sql`
  - Remove Lovable provider entries
  - Set OpenRouter as default provider

## Phase 6: Testing & Verification

### 6.1 Test Files
- [ ] **Search:** Test files for Lovable mocks/stubs
  - Update test fixtures
  - Remove Lovable-specific test cases
  - **File:** `src/test/mocks/handlers.ts` - Already updated

### 6.2 Integration Tests
- [ ] Verify all AI provider integrations work with OpenRouter
- [ ] Test fallback behavior (should fail gracefully, not fallback to Lovable)

## Phase 7: Cleanup & Final Steps

### 7.1 Code Comments
- [ ] **Search:** All code comments mentioning Lovable
  - Update or remove outdated comments
  - Update TODO comments

### 7.2 Archive Old Code
- [ ] Move Lovable-specific code to `archive/` if needed for reference
- [ ] Update `.gitignore` if needed

### 7.3 Documentation Updates
- [ ] Update `README.md` to remove Lovable references
- [ ] Update architecture documentation
- [ ] Update API documentation

## Implementation Order

1. **Start with Phase 1** (Dependencies) - Safest, no runtime impact
2. **Then Phase 2** (Core Code) - Requires testing after each change
3. **Phase 3** (UI) - Can be done incrementally
4. **Phase 4** (Environment) - Coordinate with deployment
5. **Phase 5** (Database) - Requires migration script
6. **Phase 6** (Testing) - Verify everything works
7. **Phase 7** (Cleanup) - Final polish

## Critical Decisions Needed

1. **Provider Fallback Strategy:**
   - Should we require OpenRouter API key?
   - What happens if no provider is configured?
   - Should we support direct OpenAI API as alternative?

2. **Backward Compatibility:**
   - Do we need to migrate existing projects using Lovable?
   - Should we show migration warnings in UI?

3. **Error Handling:**
   - How should we handle missing AI provider configuration?
   - Should we show helpful error messages guiding users to configure OpenRouter?

## Files Already Identified

### Code Files:
- ✅ `package.json` - `lovable-tagger` identified
- ✅ `vite.config.ts` - `componentTagger` import identified
- ✅ `src/hooks/useExternalSupabase.tsx` - Lovable fallback identified
- ✅ `supabase/functions/_shared/cosmo/providerConfig.ts` - `isLovableProvider` identified

### Documentation:
- `docs/lovable-ai-methodology.md`
- `docs/governance/05-LOVABLE-ENTERPRISE-MODE.md`
- `docs/ScrubSpork/LOVABLE TASK.md`
- `docs/migrate/MIGRATION_GUIDE.md`
- `src/docs/SECRETS.md`

## Testing Checklist

After each phase:
- [ ] Application builds successfully
- [ ] No console errors related to missing Lovable dependencies
- [ ] AI chat functionality works with OpenRouter
- [ ] Image generation works (if using Replicate/OpenRouter)
- [ ] External Supabase configuration works without Lovable fallback
- [ ] All edge functions deploy successfully
- [ ] No broken UI elements or missing text

