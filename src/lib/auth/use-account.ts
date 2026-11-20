import { useQuery } from "@tanstack/react-query";
import { accountQuery } from "@/services/account";
import { useAuth } from "./auth-provider";

export function useAccount() {
  const { user } = useAuth();
  return useQuery({
    ...accountQuery(user?.id ?? "", user?.email ?? ""),
    enabled: !!user,
  });
}
