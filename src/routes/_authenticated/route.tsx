import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { LoadingScreen } from "@/components/brand/loading-screen";
import { supabase } from "@/integrations/supabase/client";

// The session lives in browser storage, so this gate runs client-side only.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/entrar", search: { redirect: location.href } });
    }
    return { user: data.user };
  },
  pendingComponent: () => <LoadingScreen label="Verificando sua sessão" />,
  component: () => <Outlet />,
});
