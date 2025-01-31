/*
  # Initial Schema Setup for Billing Application

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `password` (text)
      - `role` (text)
      - `created_at` (timestamp)
    
    - `shops`
      - `id` (uuid, primary key)
      - `name` (text)
      - `owner_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
    
    - `items`
      - `id` (uuid, primary key)
      - `shop_id` (uuid, foreign key to shops)
      - `name` (text)
      - `price` (numeric)
      - `created_at` (timestamp)
    
    - `invoices`
      - `id` (uuid, primary key)
      - `shop_id` (uuid, foreign key to shops)
      - `customer_id` (uuid, foreign key to users)
      - `total_amount` (numeric)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for each table based on user roles
*/

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'shop_owner', 'customer')),
  created_at timestamptz DEFAULT now()
);

-- Shops table
CREATE TABLE shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Items table
CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Invoices table
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) NOT NULL,
  customer_id uuid REFERENCES users(id) NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Super admins can read all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Shops policies
CREATE POLICY "Anyone can view shops"
  ON shops
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage shops"
  ON shops
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Shop owners can manage their shops"
  ON shops
  USING (owner_id = auth.uid());

-- Items policies
CREATE POLICY "Anyone can view items"
  ON items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Shop owners can manage their items"
  ON items
  USING (
    EXISTS (
      SELECT 1 FROM shops 
      WHERE shops.id = items.shop_id 
      AND shops.owner_id = auth.uid()
    )
  );

-- Invoices policies
CREATE POLICY "Shop owners can view and create invoices for their shops"
  ON invoices
  USING (
    EXISTS (
      SELECT 1 FROM shops 
      WHERE shops.id = invoices.shop_id 
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view their invoices"
  ON invoices
  FOR SELECT
  USING (customer_id = auth.uid());

  -- Create operators table
CREATE TABLE IF NOT EXISTS operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_name text NOT NULL,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL,
  join_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('shop assistant', 'operator'))
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON operators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON operators
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow operators to read all data
CREATE POLICY "Operators can read all data"
  ON operators
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operators
      WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- Only operators can create new users
CREATE POLICY "Only operators can create users"
  ON operators
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operators
      WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON operators
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only operators can delete users
CREATE POLICY "Only operators can delete users"
  ON operators
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operators
      WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS operators_username_idx ON operators (username);
CREATE INDEX IF NOT EXISTS operators_role_idx ON operators (role);