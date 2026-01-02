# Testing Infrastructure

This project uses Vitest for unit and integration testing with React Testing Library for component tests.

## Running Tests Locally

```bash
# Watch mode - reruns on file changes
npm run test

# Single run - exits after completion
npm run test:run

# With coverage report
npm run test:coverage

# Interactive UI
npm run test:ui
```

## Test Structure

```
src/
├── test/                          # Test utilities (isolated from prod)
│   ├── setup.ts                   # Global test configuration
│   ├── test-utils.tsx             # Custom render with providers
│   └── mocks/
│       ├── supabase.ts           # Supabase client mock
│       ├── handlers.ts           # MSW API handlers
│       └── server.ts             # MSW server setup
├── contexts/__tests__/            # Context tests
├── hooks/__tests__/               # Hook tests
└── utils/__tests__/               # Utility tests
```

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Hook Tests

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  it('returns expected data', async () => {
    const { result } = renderHook(() => useMyHook());
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

## CI/CD Integration

### Reporting Results

After tests complete, POST results to the `report-test-results` edge function:

```bash
POST https://mfoeucdqopqivjzenlrt.supabase.co/functions/v1/report-test-results
Header: x-webhook-secret: YOUR_SECRET (optional, if configured)
Content-Type: application/json
```

### Request Body

```json
{
  "run_id": "github-run-123456",
  "branch": "main",
  "commit_sha": "abc123def456",
  "commit_message": "feat: add new feature",
  "triggered_by": "github-actions",
  "started_at": "2025-12-10T12:00:00Z",
  "completed_at": "2025-12-10T12:01:30Z",
  "duration_ms": 90000,
  "status": "passed",
  "total_tests": 127,
  "passed": 125,
  "failed": 2,
  "skipped": 0,
  "coverage_statements": 85.5,
  "coverage_branches": 78.2,
  "coverage_functions": 92.1,
  "coverage_lines": 84.8,
  "failed_tests": [
    {
      "name": "should handle user login",
      "file": "src/contexts/__tests__/AuthContext.test.tsx",
      "error": "Expected session to be defined",
      "stack": "Error: Expected session to be defined\n    at ..."
    }
  ],
  "coverage_details": [
    {
      "file": "src/contexts/AuthContext.tsx",
      "statements": 92,
      "branches": 85,
      "functions": 88,
      "lines": 91
    }
  ]
}
```

### GitHub Actions Example

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with coverage
        run: npm run test:coverage -- --reporter=json --outputFile=test-results.json
      
      - name: Report results
        if: always()
        run: |
          curl -X POST \
            -H "Content-Type: application/json" \
            -H "x-webhook-secret: ${{ secrets.TEST_WEBHOOK_SECRET }}" \
            -d @test-results.json \
            https://mfoeucdqopqivjzenlrt.supabase.co/functions/v1/report-test-results
```

## Mocking

### Supabase Client

The Supabase client is mocked in `src/test/mocks/supabase.ts`. Key mocks include:

- `auth.getSession()` - Returns mock session
- `auth.signInWithPassword()` - Returns mock user and session
- `auth.signOut()` - Clears session
- `from()` - Returns chainable query builder
- `functions.invoke()` - Returns mock function response

### API Endpoints

API endpoints are mocked using MSW (Mock Service Worker) in `src/test/mocks/handlers.ts`:

- `/functions/v1/chat` - Returns streaming response
- `/functions/v1/generate-image` - Returns image URL
- `/functions/v1/check-quota` - Returns quota status

## Coverage Thresholds

Aim for the following coverage targets:

- Statements: 80%+
- Branches: 70%+
- Functions: 80%+
- Lines: 80%+

## Best Practices

1. **Test behavior, not implementation** - Focus on what the component does, not how
2. **Use meaningful test names** - Describe the expected behavior
3. **Keep tests isolated** - Each test should be independent
4. **Mock external dependencies** - Use MSW for API calls, vi.mock for modules
5. **Test edge cases** - Empty states, errors, loading states
6. **Avoid testing internals** - Don't test private functions or state directly
