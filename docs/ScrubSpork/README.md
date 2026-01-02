COSMO 2.0 API Contracts

Files:
- openapi.yaml  : OpenAPI 3.0 spec for COSMO 2.0 endpoints used by Spork.
- types.ts      : Matching TypeScript types for a Spork client wrapper.

Intended use:
- Drop openapi.yaml into COSMO backend repo as the initial contract.
- Spork (presentation layer) wires to these endpoints via a single client module.
