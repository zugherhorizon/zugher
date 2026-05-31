import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  emailConfirmed: boolean;
};

const initial: AuthState = {
  loading: true,
  session: null,
  user: null,
  emailConfirmed: false,
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(initial);

  useEffect(() => {
    const apply = (session: Session | null) =>
      setState({
        loading: false,
        session,
        user: session?.user ?? null,
        emailConfirmed: !!session?.user?.email_confirmed_at,
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => apply(session),
    );

    supabase.auth.getSession().then(({ data }) => apply(data.session));

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
