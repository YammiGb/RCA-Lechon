-- Migration: Add payment_type and down_payment_amount fields to orders table

-- Add payment_type column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_type text CHECK (payment_type IN ('down-payment', 'full-payment'));

-- Add down_payment_amount column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS down_payment_amount numeric(12,2);

