import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/notile/page-header";
import { priorityDot, priorityVariants } from "@/components/notile/priority-badge";
import { useTasks } from "@/hooks/use-tasks";
import { PRIORITIES, PRIORITY_LABEL, type Priority } from "@/lib/tasks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/nova-tarefa")({
  head: () => ({
    meta: [
      { title: "Nova tarefa — NOTILE Task Manager" },
      { name: "description", content: "Cadastre uma nova tarefa com título, descrição, vencimento e prioridade." },
      { property: "og:title", content: "Nova tarefa — NOTILE Task Manager" },
      { property: "og:description", content: "Cadastre uma nova tarefa com título, descrição, vencimento e prioridade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewTaskPage,
});

const schema = z.object({
  title: z.string().trim().min(1, "Informe um título.").max(100, "Máximo de 100 caracteres."),
  description: z.string().trim().max(500, "Máximo de 500 caracteres."),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data de vencimento."),
  priority: z.enum(["baixa", "media", "alta"]),
});

type Errors = Partial<Record<"title" | "description" | "dueDate", string>>;

const PRIORITY_HINT: Record<Priority, string> = {
  baixa: "Pode esperar",
  media: "Importante",
  alta: "Urgente",
};

function NewTaskPage() {
  const { addTask } = useTasks();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [errors, setErrors] = useState<Errors>({});
  const [addAnother, setAddAnother] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({ title, description, dueDate, priority });
    if (!result.success) {
      const next: Errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    const task = addTask(result.data);
    toast.success("Tarefa criada", { description: task.title });
    if (addAnother) {
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("media");
      setErrors({});
    } else {
      navigate({ to: "/tarefas" });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Cadastro" title="Nova tarefa" description="Preencha os detalhes da tarefa que você quer acompanhar." />

      <form onSubmit={onSubmit} noValidate className="surface-card max-w-2xl p-5 sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Revisar relatório mensal"
              maxLength={100}
              aria-invalid={!!errors.title}
              className="h-11"
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">
              Descrição <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes, links ou observações…"
              rows={4}
              maxLength={500}
              aria-invalid={!!errors.description}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="text-destructive">{errors.description}</span>
              <span>{description.length}/500</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dueDate">Data de vencimento</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-invalid={!!errors.dueDate}
              className="h-11 sm:max-w-60"
            />
            {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate}</p>}
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Prioridade</legend>
            <div role="radiogroup" className="grid grid-cols-3 gap-2 sm:gap-3">
              {PRIORITIES.map((p) => {
                const selected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPriority(p)}
                    className={cn(
                      "relative flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all sm:p-4",
                      selected ? "border-primary bg-primary-soft" : "border-border hover:border-primary/30",
                    )}
                  >
                    <span className={cn(priorityVariants({ priority: p }), "px-2")}>
                      <span className={cn("size-1.5 rounded-full", priorityDot[p])} />
                      {PRIORITY_LABEL[p]}
                    </span>
                    <span className="text-xs text-muted-foreground">{PRIORITY_HINT[p]}</span>
                    {selected && (
                      <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={addAnother}
              onChange={(e) => setAddAnother(e.target.checked)}
              className="size-4 accent-primary"
            />
            Continuar cadastrando após salvar
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: "/tarefas" })}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" className="px-6">
              Salvar tarefa
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
