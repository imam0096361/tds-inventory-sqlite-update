-- Fix maintenance_costs table - Add missing columns
-- Run this on your production database

ALTER TABLE maintenance_costs
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS warranty_status TEXT,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS completion_date DATE;

-- Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'maintenance_costs'
ORDER BY ordinal_position;

