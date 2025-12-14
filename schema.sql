
-- Create the logs table
CREATE TABLE IF NOT EXISTS logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  start_time TIMESTAMPTZ DEFAULT now(),
  end_time TIMESTAMPTZ,
  user_query TEXT,
  department TEXT,
  status TEXT,
  duration TEXT,
  is_flagged BOOLEAN DEFAULT false,
  metadata JSONB, 
  messages JSONB
);

-- Enable Row Level Security (RLS)
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to insert logs (for the demo/kiosk)
-- In a real production app, you might want to restrict this to authenticated users
CREATE POLICY "Enable insert for all users" ON logs FOR INSERT WITH CHECK (true);

-- Create a policy to select logs (for the admin dashboard)
CREATE POLICY "Enable select for all users" ON logs FOR SELECT USING (true);

-- Create a policy to update logs (for flagging)
CREATE POLICY "Enable update for all users" ON logs FOR UPDATE USING (true);
