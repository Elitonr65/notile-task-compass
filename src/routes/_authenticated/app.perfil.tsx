import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/notile/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/auth/use-account";
import { useSignOut } from "@/lib/auth/use-sign-out";
import { authErrorMessage, changePasswordSchema, fieldErrors, profileSchema } from "@/lib/validation/auth";
import { ROLE_LABEL, SUBSCRIPTION_STATUS_LABEL, updateProfile } from "@/services/account";

export const Route = createFileRoute("/_authenticated/app/perfil")({
  head: () => ({ meta: [{ title: "Meu perfil — NOTILE Task Manager" }, { name: "description", content: "Dados da conta, empresa e senha." }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data, isLoading } = useAccount();
  const queryClient = useQueryClient();
  const signOut = useSignOut();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) {
      setFullName(data.profile.fullName);
      setPhone(data.profile.phone);
    }
  }, [data]);

  if (isLoading || !data) return <Skeleton className="h-96 rounded-xl" />;

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const r = profileSchema.safeParse({ fullName, phone });
    if (!r.success) return setErrors(fieldErrors(r.error));
    setErrors({});
    try {
      await updateProfile(data.userId, r.data);
      await queryClient.invalidateQueries({ queryKey: ["account", data.userId] });
      toast.success("Perfil atualizado.");
    } catch {
      toast.error("Não foi possível salvar o perfil.");
    }
  };

  const changePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = changePasswordSchema.safeParse({
      currentPassword: String(f.get("currentPassword") ?? ""),
      password: String(f.get("password") ?? ""),
      confirmPassword: String(f.get("confirmPassword") ?? ""),
    });
    if (!r.success) return setPwErrors(fieldErrors(r.error));
    setPwErrors({});
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: r.data.password, current_password: r.data.currentPassword });
    setBusy(false);
    if (error) return setPwErrors({ form: authErrorMessage(error) });
    form.reset();
    toast.success("Senha alterada.");
  };

  const sub = data.membership?.subscription;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Conta" title="Meu perfil" description={data.email} />
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={(e) => void saveProfile(e)} noValidate className="surface-card flex flex-col gap-4 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Dados pessoais</h2>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Nome</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11" />
            {errors["fullName"] && <p className="text-sm text-destructive">{errors["fullName"]}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11" />
            {errors["phone"] && <p className="text-sm text-destructive">{errors["phone"]}</p>}
          </div>
          <Button type="submit" className="self-start">Salvar</Button>
        </form>

        <div className="surface-card flex flex-col gap-3 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Empresa e plano</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Empresa</dt><dd className="font-medium">{data.membership?.company.name ?? "—"}</dd>
            <dt className="text-muted-foreground">Função</dt><dd className="font-medium">{data.membership ? ROLE_LABEL[data.membership.role] : "—"}</dd>
            <dt className="text-muted-foreground">Plano</dt><dd className="font-medium">{sub?.plan.name ?? "—"}</dd>
            <dt className="text-muted-foreground">Assinatura</dt><dd className="font-medium">{sub ? SUBSCRIPTION_STATUS_LABEL[sub.status] : "—"}</dd>
            <dt className="text-muted-foreground">Limite de tarefas</dt><dd className="font-medium">{sub ? (sub.plan.maxTasks ?? "Ilimitado") : "—"}</dd>
          </dl>
          <Button variant="outline" className="mt-auto self-start" onClick={() => void signOut()}>Sair da conta</Button>
        </div>

        <form onSubmit={(e) => void changePassword(e)} noValidate className="surface-card flex flex-col gap-4 p-5 sm:p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Alterar senha</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["currentPassword", "Senha atual", "current-password"],
              ["password", "Nova senha", "new-password"],
              ["confirmPassword", "Confirmar nova senha", "new-password"],
            ].map(([id, label, ac]) => (
              <div key={id} className="flex flex-col gap-1.5">
                <Label htmlFor={id}>{label}</Label>
                <Input id={id} name={id} type="password" autoComplete={ac} className="h-11" />
                {pwErrors[id as string] && <p className="text-sm text-destructive">{pwErrors[id as string]}</p>}
              </div>
            ))}
          </div>
          {pwErrors["form"] && <p role="alert" className="text-sm text-destructive">{pwErrors["form"]}</p>}
          <Button type="submit" disabled={busy} className="self-start">{busy ? "Aguarde…" : "Alterar senha"}</Button>
        </form>
      </div>
    </div>
  );
}
