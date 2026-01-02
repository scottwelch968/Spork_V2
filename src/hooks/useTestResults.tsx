import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FailedTest {
  name: string;
  file: string;
  error: string;
  stack?: string;
}

export interface CoverageDetail {
  file: string;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

export interface TestRun {
  id: string;
  run_id: string;
  branch: string | null;
  commit_sha: string | null;
  commit_message: string | null;
  triggered_by: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage_statements: number | null;
  coverage_branches: number | null;
  coverage_functions: number | null;
  coverage_lines: number | null;
  failed_tests: FailedTest[];
  coverage_details: CoverageDetail[];
  status: 'pending' | 'running' | 'passed' | 'failed' | 'error';
  error_message: string | null;
  created_at: string;
}

const SESSION_KEY = 'system_session_token';

export const useTestResults = () => {
  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null;

  const latestRunQuery = useQuery({
    queryKey: ['test-runs', 'latest'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: { action: 'get_latest_test_run', session_token: sessionToken }
      });
      if (error) throw error;
      return data.data as TestRun | null;
    },
    enabled: !!sessionToken,
    staleTime: 30000,
  });

  const historyQuery = useQuery({
    queryKey: ['test-runs', 'history'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: { action: 'get_test_runs', session_token: sessionToken, limit: 10 }
      });
      if (error) throw error;
      return (data.data || []) as TestRun[];
    },
    enabled: !!sessionToken,
    staleTime: 30000,
  });

  return {
    latestRun: latestRunQuery.data,
    isLoadingLatest: latestRunQuery.isLoading,
    history: historyQuery.data || [],
    isLoadingHistory: historyQuery.isLoading,
    refetch: () => {
      latestRunQuery.refetch();
      historyQuery.refetch();
    },
  };
};
