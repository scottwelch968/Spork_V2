-- Enable real-time updates on usage_logs table
ALTER TABLE usage_logs REPLICA IDENTITY FULL;

-- Add usage_logs to supabase_realtime publication for real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE usage_logs;