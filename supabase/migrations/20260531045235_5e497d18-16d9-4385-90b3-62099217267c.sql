-- Rendre le pays obligatoire en base de données

-- Mettre à jour les éventuelles lignes existantes avec une valeur par défaut
UPDATE public.profiles SET country = 'France' WHERE country IS NULL OR country = '';

-- Ajouter la contrainte NOT NULL
ALTER TABLE public.profiles ALTER COLUMN country SET NOT NULL;

-- Mettre à jour le trigger pour insérer le pays obligatoirement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  meta_profile text;
  resolved_profile public.user_profile;
begin
  meta_profile := coalesce(new.raw_user_meta_data->>'profile', 'entrepreneur');
  begin
    resolved_profile := meta_profile::public.user_profile;
  exception when invalid_text_representation then
    resolved_profile := 'entrepreneur'::public.user_profile;
  end;

  insert into public.profiles (id, first_name, last_name, phone, profile, country, region, department, city, sector)
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
    nullif(new.raw_user_meta_data->>'sector', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;