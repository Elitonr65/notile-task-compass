import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, ShieldCheck, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NOTILE Task Manager — Gestão de tarefas para empresas" },
      { name: "description", content: BRAND.tagline },
      { property: "og:title", content: "NOTILE Task Manager" },
      { property: "og:description", content: BRAND.tagline },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const FEATURES = [
  { icon: Users, title: "Equipes e responsáveis", text: "Organize o trabalho por empresa, com papéis e permissões." },
  { icon: BarChart3, title: "Indicadores reais", text: "Acompanhe o andamento das tarefas em um painel claro." },
  { icon: ShieldCheck, title: "Dados protegidos", text: "Cada empresa acessa somente as próprias informações." },
];

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <BrandLogo />
        <Button asChild variant="outline">
          <Link to="/entrar">Entrar</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-glow">{BRAND.product}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold text-navy sm:text-5xl">
          Tarefas, equipes e resultados sob controle.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">{BRAND.tagline}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="px-6">
            <Link to="/entrar" search={{ modo: "cadastro" }}>
              Começar gratuitamente <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="px-6">
            <Link to="/entrar">Já tenho conta</Link>
          </Button>
        </div>
        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="surface-card p-6">
              <div className="grid size-10 place-items-center rounded-lg bg-cream text-navy">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-navy">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">{BRAND.company}</footer>
    </div>
  );
}
