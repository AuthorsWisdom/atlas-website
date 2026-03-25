-- Run this in Supabase SQL Editor after creating the profiles table
-- Adds columns needed for Stripe web subscriptions

alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists subscription_source text default 'none';
alter table profiles add column if not exists subscription_status text default 'inactive';
alter table profiles add column if not exists is_pro boolean default false;
