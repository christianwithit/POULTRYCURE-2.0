-- Edge Functions Migration
-- Creates tables for rate limiting, usage tracking, and error logging

-- Usage Tracking Table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  request_count INTEGER DEFAULT 0,
  last_request TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Diagnosis Logs Table
CREATE TABLE IF NOT EXISTS diagnosis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'image')),
  success BOOLEAN NOT NULL,
  response_time BIGINT, -- Response time in milliseconds
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error Logs Table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error TEXT NOT NULL,
  stack TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  service TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_data JSONB,
  severity TEXT DEFAULT 'error' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_date ON usage_tracking(date);
CREATE INDEX IF NOT EXISTS idx_diagnosis_logs_user_timestamp ON diagnosis_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_diagnosis_logs_timestamp ON diagnosis_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_service ON error_logs(service);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);

-- Enable Row Level Security
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view their own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service can insert usage tracking" ON usage_tracking
  FOR INSERT WITH CHECK (true);

-- RLS Policies for diagnosis_logs
CREATE POLICY "Users can view their own diagnosis logs" ON diagnosis_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert diagnosis logs" ON diagnosis_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for error_logs
CREATE POLICY "Users can view their own error logs" ON error_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old logs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM diagnosis_logs WHERE timestamp < NOW() - INTERVAL '30 days';
  DELETE FROM error_logs WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled function call (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-logs', '0 2 * * *', 'SELECT cleanup_old_logs();');

-- Grant necessary permissions
GRANT ALL ON usage_tracking TO authenticated;
GRANT ALL ON diagnosis_logs TO authenticated;
GRANT ALL ON error_logs TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE usage_tracking IS 'Tracks API usage per user per day for rate limiting';
COMMENT ON TABLE diagnosis_logs IS 'Logs all diagnosis requests for analytics and monitoring';
COMMENT ON TABLE error_logs IS 'Logs errors from edge functions for debugging and monitoring';

COMMENT ON COLUMN usage_tracking.request_count IS 'Number of API requests made by the user on this date';
COMMENT ON COLUMN usage_tracking.last_request IS 'Timestamp of the last request from the user';
COMMENT ON COLUMN diagnosis_logs.response_time IS 'Time taken to process the diagnosis request in milliseconds';
COMMENT ON COLUMN error_logs.severity IS 'Severity level of the error for filtering and prioritization';
