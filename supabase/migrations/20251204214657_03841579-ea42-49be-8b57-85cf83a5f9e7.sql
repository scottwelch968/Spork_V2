-- Add model column to space_chat_messages table for schema parity with messages table
ALTER TABLE public.space_chat_messages ADD COLUMN model text;