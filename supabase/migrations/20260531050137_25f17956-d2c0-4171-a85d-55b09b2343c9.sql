
-- Audience enum + nouvelles colonnes profiles
CREATE TYPE public.audience_type AS ENUM ('grand_public', 'pro');

ALTER TABLE public.profiles
  ADD COLUMN audience public.audience_type,
  ADD COLUMN territory text,
  ADD COLUMN needs text;

-- Mise à jour du trigger handle_new_user pour inclure audience/territory/needs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  meta_profile text;
  resolved_profile public.user_profile;
  meta_audience text;
  resolved_audience public.audience_type;
begin
  meta_profile := coalesce(new.raw_user_meta_data->>'profile', 'entrepreneur');
  begin
    resolved_profile := meta_profile::public.user_profile;
  exception when invalid_text_representation then
    resolved_profile := 'entrepreneur'::public.user_profile;
  end;

  meta_audience := nullif(new.raw_user_meta_data->>'audience', '');
  begin
    resolved_audience := meta_audience::public.audience_type;
  exception when invalid_text_representation then
    resolved_audience := null;
  end;

  insert into public.profiles (
    id, first_name, last_name, phone, profile, country,
    region, department, city, sector, audience, territory, needs
  )
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'first_name', ''),
    nullif(new.raw_user_meta_data->>'last_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    resolved_profile,
    coalesce(nullif(new.raw_user_meta_data->>'country', ''), 'France'),
    nullif(new.raw_user_meta_data->>'region', ''),
    nullif(new.raw_user_meta_data->>'department', ''),
    nullif(new.raw_user_meta_data->>'city', ''),
    nullif(new.raw_user_meta_data->>'sector', ''),
    resolved_audience,
    nullif(new.raw_user_meta_data->>'territory', ''),
    nullif(new.raw_user_meta_data->>'needs', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;

-- Sessions chat (un visiteur = un visitor_id côté client, stocké en localStorage)
CREATE TABLE public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL,
  audience public.audience_type,
  territory text,
  lead_email text,
  lead_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX chat_sessions_visitor_idx ON public.chat_sessions(visitor_id);

GRANT ALL ON public.chat_sessions TO service_role;
-- Pas d'accès direct aux clients : tout passe par la route serveur
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all chat sessions"
ON public.chat_sessions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER chat_sessions_updated_at
BEFORE UPDATE ON public.chat_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Messages chat
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  parts jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_session_idx ON public.chat_messages(session_id, created_at);

GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all chat messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
