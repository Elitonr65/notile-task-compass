import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type MemberRole = Database["public"]["Enums"]["member_role"];
export type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];

export const ROLE_LABEL: Record<MemberRole, string> = {
  company_admin: "Administrador da empresa",
  manager: "Gestor",
  collaborator: "Colaborador",
};

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  pending: "Pendente",
  trialing: "Em avaliação",
  active: "Ativa",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
};

export interface AccountContext {
  userId: string;
  email: string;
  profile: { fullName: string; phone: string };
  isPlatformAdmin: boolean;
  membership: {
    role: MemberRole;
    company: { id: string; name: string };
    subscription: {
      status: SubscriptionStatus;
      startedAt: string;
      renewsAt: string | null;
      canceledAt: string | null;
      plan: { code: string; name: string; maxTasks: number | null; maxMembers: number | null };
    } | null;
  } | null;
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export async function fetchAccount(userId: string, email: string): Promise<AccountContext> {
  const [profileRes, memberRes, rolesRes] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", userId).maybeSingle(),
    supabase
      .from("company_members")
      .select(
        "role, created_at, company:companies(id, name, subscription:subscriptions(status, started_at, renews_at, canceled_at, plan:plans(code, name, max_tasks, max_members)))",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (memberRes.error) throw memberRes.error;
  if (rolesRes.error) throw rolesRes.error;

  const m = memberRes.data?.[0];
  const company = one(m?.company);
  const sub = one(company?.subscription);
  const plan = one(sub?.plan);

  return {
    userId,
    email,
    profile: { fullName: profileRes.data?.full_name ?? "", phone: profileRes.data?.phone ?? "" },
    isPlatformAdmin: (rolesRes.data ?? []).some((r) => r.role === "platform_admin"),
    membership:
      m && company
        ? {
            role: m.role,
            company: { id: company.id, name: company.name },
            subscription:
              sub && plan
                ? {
                    status: sub.status,
                    startedAt: sub.started_at,
                    renewsAt: sub.renews_at,
                    canceledAt: sub.canceled_at,
                    plan: { code: plan.code, name: plan.name, maxTasks: plan.max_tasks, maxMembers: plan.max_members },
                  }
                : null,
          }
        : null,
  };
}

export const accountQuery = (userId: string, email: string) =>
  queryOptions({
    queryKey: ["account", userId],
    queryFn: () => fetchAccount(userId, email),
    staleTime: 60_000,
  });

export async function updateProfile(userId: string, input: { fullName: string; phone: string }) {
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: input.fullName, phone: input.phone || null })
    .eq("id", userId);
  if (error) throw error;
}

export async function updateCompanyName(companyId: string, name: string) {
  const { data, error } = await supabase.from("companies").update({ name }).eq("id", companyId).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("forbidden");
}
