import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { BrandIcon, BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND } from "@/config/brand";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { authErrorMessage, fieldErrors, safeRedirect, signInSchema, signUpSchema } from "@/lib/validation/auth";

interface EntrarSearch {
  redirect?: string;
  modo?: "cadastro";
}

export const Route = createFileRoute("/entrar")({
  validateSearch: (s: Record<string, unknown>): EntrarSearch => {
    const out: EntrarSearch = {};
    if (typeof s["redirect"] === "string") out.redirect = s["redirect"];
    if (s["modo"] === "cadastro") out.modo = "cadastro";
    return out;
  },
  head: () => ({
    meta: [
      { title: "Entrar — NOTILE Task Manager" },
      { name: "description", content: "Acesse ou crie sua conta no NOTILE Task Manager." },
      { property: "og:title", content: "Entrar — NOTILE Task Manager" },
      { property: "og:description", content: "Acesse ou crie sua conta no NOTILE Task Manager." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EntrarPage,
});

function Field({ id, label, error, ...props }: { id: string; label: string; error?: string | undefined } & React.ComponentProps<"input">) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} aria-invalid={!!error} className="h-11 bg-card" {...props} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function EntrarPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"entrar" | "cadastro">(search.modo === "cadastro" ? "cadastro" : "entrar");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const target = safeRedirect(search.redirect);

  useEffect(() => {
    if (!loading && user) void navigate({ to: target as "/app", replace: true });
  }, [loading, user, navigate, target]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    setErrors({});
    if (mode === "entrar") {
      const r = signInSchema.safeParse({ email: get("email"), password: get("password") });
      if (!r.success) return setErrors(fieldErrors(r.error));
      setBusy(true);
      const { error } = await supabase.auth.signInWithPassword(r.data);
      setBusy(false);
      if (error) return setErrors({ form: authErrorMessage(error) });
      toast.success("Bem-vindo de volta!");
      return;
    }
    const r = signUpSchema.safeParse({
      fullName: get("fullName"),
      companyName: get("companyName"),
      email: get("email"),
      password: get("password"),
      confirmPassword: get("confirmPassword"),
      acceptTerms: f.get("acceptTerms") === "on",
    });
    if (!r.success) return setErrors(fieldErrors(r.error));
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: r.data.email,
      password: r.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/entrar`,
        data: { full_name: r.data.fullName, company_name: r.data.companyName, terms_version: BRAND.termsVersion },
      },
    });
    setBusy(false);
    if (error) return setErrors({ form: authErrorMessage(error) });
    setSentTo(r.data.email);
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/entrar" });
    if (result.error) toast.error("Não foi possível entrar com o Google.");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-gradient-navy p-12 text-navy-foreground lg:flex">
        <BrandLogo tone="light" />
        <div>
          <BrandIcon className="size-20" />
          <h1 className="mt-6 max-w-md text-3xl font-bold">Organização empresarial com segurança e simplicidade.</h1>
          <p className="mt-3 max-w-md text-sm text-sidebar-muted">{BRAND.tagline}</p>
        </div>
        <p className="text-xs text-sidebar-muted">{BRAND.company}</p>
      </aside>
      <main className="flex items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-block lg:hidden">
            <BrandLogo />
          </Link>
          {sentTo ? (
            <div className="surface-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-navy">Confirme seu e-mail</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enviamos um link de confirmação para <strong className="text-foreground">{sentTo}</strong>. Abra o link para ativar sua conta e acessar o painel.
              </p>
              <Button variant="outline" className="mt-6 w-full" onClick={() => { setSentTo(null); setMode("entrar"); }}>
                Voltar para o login
              </Button>
            </div>
          ) : (
            <div className="surface-card p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-navy">{mode === "entrar" ? "Entrar" : "Criar conta"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "entrar" ? "Acesse o painel da sua empresa." : "Crie sua empresa no plano Free."}
              </p>
              <button type="button" onClick={() => void google()} className="google-btn mt-6 flex h-11 w-full items-center justify-center gap-2.5 rounded-md text-sm font-medium">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
                Continuar com o Google
              </button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
              </div>
              <form onSubmit={(e) => void onSubmit(e)} noValidate className="flex flex-col gap-4">
                {mode === "cadastro" && (
                  <>
                    <Field id="fullName" label="Seu nome" autoComplete="name" error={errors["fullName"]} />
                    <Field id="companyName" label="Nome da empresa" autoComplete="organization" error={errors["companyName"]} />
                  </>
                )}
                <Field id="email" label="E-mail" type="email" autoComplete="email" error={errors["email"]} />
                <Field id="password" label="Senha" type="password" autoComplete={mode === "entrar" ? "current-password" : "new-password"} error={errors["password"]} />
                {mode === "cadastro" && (
                  <>
                    <Field id="confirmPassword" label="Confirmar senha" type="password" autoComplete="new-password" error={errors["confirmPassword"]} />
                    <label className="flex items-start gap-2 text-sm text-muted-foreground">
                      <input type="checkbox" name="acceptTerms" className="mt-0.5 size-4 accent-primary" />
                      Li e aceito os termos de uso e a política de privacidade.
                    </label>
                    {errors["acceptTerms"] && <p className="text-sm text-destructive">{errors["acceptTerms"]}</p>}
                  </>
                )}
                {errors["form"] && <p role="alert" className="rounded-md bg-destructive-soft px-3 py-2 text-sm text-destructive">{errors["form"]}</p>}
                <Button type="submit" size="lg" disabled={busy} className="mt-1">
                  {busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar conta"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "entrar" ? "Ainda não tem conta? " : "Já tem conta? "}
                <button type="button" className="font-semibold text-primary hover:underline" onClick={() => { setErrors({}); setMode(mode === "entrar" ? "cadastro" : "entrar"); }}>
                  {mode === "entrar" ? "Criar conta" : "Entrar"}
                </button>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
