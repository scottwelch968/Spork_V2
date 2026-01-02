-- Add account_status enum and column to profiles table
CREATE TYPE account_status_enum AS ENUM ('active', 'cancelled', 'suspended');

ALTER TABLE profiles ADD COLUMN account_status account_status_enum DEFAULT 'active' NOT NULL;

-- Create index for faster queries on account_status
CREATE INDEX idx_profiles_account_status ON profiles(account_status);

-- Update existing profiles to have active status (for safety, though default handles this)
UPDATE profiles SET account_status = 'active' WHERE account_status IS NULL;