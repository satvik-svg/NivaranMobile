-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  username text DEFAULT 'unique'::text,
  fullname text,
  avatar_url text,
  CONSTRAINT Profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.issues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['road_maintenance'::text, 'street_lighting'::text, 'waste_management'::text, 'water_supply'::text, 'public_safety'::text, 'parks_recreation'::text, 'noise_pollution'::text, 'other'::text])),
  location jsonb NOT NULL,
  images ARRAY,
  audio_url text,
  status text DEFAULT 'reported'::text CHECK (status = ANY (ARRAY['reported'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])),
  votes integer DEFAULT 0,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT issues_pkey PRIMARY KEY (id),
  CONSTRAINT issues_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points_earned integer NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rewards_pkey PRIMARY KEY (id),
  CONSTRAINT rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  points integer DEFAULT 0,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  issue_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT votes_pkey PRIMARY KEY (id),
  CONSTRAINT votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT votes_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(id)
);