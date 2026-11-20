import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDue(date: string) {
  return format(parseISO(date), "dd 'de' MMM, yyyy", { locale: ptBR });
}

export function formatToday(date = new Date()) {
  const s = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
