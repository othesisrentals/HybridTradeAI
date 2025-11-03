-- Minimal schema
CREATE TABLE IF NOT EXISTS users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE, full_name text, withdrawable_balance numeric DEFAULT 0);
CREATE TABLE IF NOT EXISTS transactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id), type text, amount numeric, meta jsonb, created_at timestamptz DEFAULT now());
