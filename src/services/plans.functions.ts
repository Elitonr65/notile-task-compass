import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface PublicPlan {
  code: string;
  name: string;
  description: string;
  maxTasks: number | null;
  maxMembers: number | null;
  features: string[];
  priceMonthlyCents: number | null;
  currency: string;
}

export const listPublicPlans = createServerFn({ method: "GET" }).handler(async (): Promise<PublicPlan[]> => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    console.error("listPublicPlans: backend configuration missing");
    return [];
  }
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await client
    .from("plans")
    .select("code, name, description, max_tasks, max_members, features, price_monthly_cents, currency")
    .eq("is_active", true)
    .order("sort_order");
  if (error) {
    console.error("listPublicPlans failed", error.message);
    return [];
  }
  return (data ?? []).map((p) => ({
    code: p.code,
    name: p.name,
    description: p.description,
    maxTasks: p.max_tasks,
    maxMembers: p.max_members,
    features: Array.isArray(p.features) ? p.features.filter((f): f is string => typeof f === "string") : [],
    priceMonthlyCents: p.price_monthly_cents,
    currency: p.currency,
  }));
});
