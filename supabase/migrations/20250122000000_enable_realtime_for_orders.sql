-- Enable Realtime for orders table
-- This allows the frontend to subscribe to INSERT/UPDATE/DELETE events on the orders table

-- Add orders table to supabase_realtime publication
-- This enables real-time subscriptions for the orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Verify the table is in the publication (this will show in logs)
-- You can check by running: SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';


