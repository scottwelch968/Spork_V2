# Lovable AI Methodology Guide

*Exported from Spork AI Code Debugger*

---

# Core Principles

## 1. Understand Before Acting
- Read relevant files thoroughly before suggesting changes
- Map component relationships and data flow
- Identify existing patterns in the codebase
- Ask clarifying questions when requirements are ambiguous

## 2. Incremental Refinement
- Start with the simplest solution that works
- Add complexity only when needed
- Test assumptions at each step
- Refactor as patterns emerge

## 3. Context Is Everything
- Consider where code runs (client/server)
- Understand user permissions and access levels
- Think about error states and edge cases
- Account for existing technical debt

## 4. Consistency Over Cleverness
- Match existing code style and patterns
- Use established conventions in the project
- Document non-obvious decisions
- Prefer readability over brevity

---

# Problem-Solving Framework

## For Bugs
1. **Reproduce** - Understand the symptoms fully
2. **Trace** - Follow data/control flow
3. **Identify** - Find root cause, not just symptoms
4. **Fix** - At the appropriate abstraction level
5. **Verify** - Check related areas for same issue

## For Features
1. **Clarify** - Requirements and acceptance criteria
2. **Design** - Data model changes first
3. **Plan** - Component structure
4. **Secure** - Consider security implications
5. **Build** - Incrementally with testing

## For Performance
1. **Measure** - Before optimizing
2. **Identify** - The actual bottleneck
3. **Apply** - Appropriate optimization
4. **Verify** - Measure improvement
5. **Document** - Any tradeoffs made

## For Refactoring
1. **Test** - Ensure coverage exists
2. **Small Steps** - One change at a time
3. **Verify** - Tests pass after each step
4. **Document** - New patterns established

---

# Code Review Checklist

## Security
- [ ] No hardcoded secrets or credentials
- [ ] Input validation on all user data
- [ ] Proper authentication checks
- [ ] RLS policies for new tables
- [ ] No SQL injection vectors
- [ ] XSS prevention in place

## Performance
- [ ] No N+1 queries
- [ ] Appropriate indexes exist
- [ ] Memoization where needed
- [ ] No unnecessary re-renders
- [ ] Bundle size impact considered

## Code Quality
- [ ] Single responsibility principle
- [ ] DRY without over-abstraction
- [ ] Clear naming conventions
- [ ] Proper error handling
- [ ] TypeScript types complete

## Testing
- [ ] Unit tests for new logic
- [ ] Integration tests for features
- [ ] Edge cases covered
- [ ] Error states tested

## Documentation
- [ ] Complex logic commented
- [ ] Public APIs documented
- [ ] README updated if needed

---

# React Patterns Reference

## Component Patterns

### Compound Components
```tsx
<Select>
  <Select.Trigger />
  <Select.Content>
    <Select.Item value="1">Option 1</Select.Item>
  </Select.Content>
</Select>
```

### Render Props
```tsx
<DataFetcher url="/api/data">
  {({ data, loading, error }) => (
    loading ? <Spinner /> : <DataList data={data} />
  )}
</DataFetcher>
```

### Custom Hooks
```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}
```

## State Patterns

### Reducer for Complex State
```tsx
const [state, dispatch] = useReducer(reducer, initialState);
```

### Derived State
```tsx
const filteredItems = useMemo(
  () => items.filter(item => item.status === filter),
  [items, filter]
);
```

---

# Supabase Patterns Reference

## RLS Policy Template
```sql
-- Enable RLS
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY "Users can view own data"
ON public.my_table FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own data
CREATE POLICY "Users can insert own data"
ON public.my_table FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
ON public.my_table FOR UPDATE
USING (auth.uid() = user_id);
```

## Edge Function Template
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    // Your logic here
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

## Real-time Subscription
```typescript
useEffect(() => {
  const channel = supabase
    .channel("my-channel")
    .on("postgres_changes", 
      { event: "*", schema: "public", table: "my_table" },
      (payload) => handleChange(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

# Debugging Guide

## Frontend Debugging

### React DevTools
- Components tab: Inspect props and state
- Profiler tab: Find re-render causes
- Highlight updates to see what re-renders

### Network Issues
1. Check browser Network tab
2. Verify request payload
3. Check response status and body
4. Look for CORS errors

### State Issues
1. Add console.log at state changes
2. Use React DevTools to inspect
3. Check useEffect dependencies
4. Verify async timing

## Backend Debugging

### Edge Function Logs
- Check Supabase dashboard logs
- Add console.log for tracing
- Log request body on entry
- Log errors with full context

### Database Issues
1. Test query in SQL editor
2. Check RLS policies
3. Verify user context
4. Look at query explain plan

## Common Issues

### "Cannot read property of undefined"
- Check if data loaded before access
- Add optional chaining (?.)
- Verify API response shape

### Infinite Re-renders
- Check useEffect dependencies
- Look for state updates in render
- Verify object reference stability

### RLS Blocking Queries
- Test with service role to confirm
- Check auth.uid() is set
- Verify policy logic

---

