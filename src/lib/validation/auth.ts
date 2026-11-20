import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .max(72, "A senha pode ter no máximo 72 caracteres.")
  .regex(/[A-Za-z]/, "Inclua pelo menos uma letra.")
  .regex(/[0-9]/, "Inclua pelo menos um número.");

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Informe seu e-mail.")
  .max(255, "E-mail muito longo.")
  .email("Informe um e-mail válido.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha."),
});

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Informe seu nome.").max(120, "Máximo de 120 caracteres."),
    companyName: z.string().trim().min(2, "Informe o nome da empresa.").max(120, "Máximo de 120 caracteres."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "É preciso aceitar os termos para continuar." }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  })
  .refine((d) => d.password !== d.currentPassword, {
    path: ["password"],
    message: "A nova senha precisa ser diferente da atual.",
  });

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome.").max(120, "Máximo de 120 caracteres."),
  phone: z
    .string()
    .trim()
    .max(30, "Máximo de 30 caracteres.")
    .regex(/^[0-9+()\-\s]*$/, "Use apenas números, espaços, +, ( ) e -."),
});

export const companySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da empresa.").max(120, "Máximo de 120 caracteres."),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120, "Máximo de 120 caracteres."),
  email: emailSchema,
  company: z.string().trim().max(120, "Máximo de 120 caracteres."),
  subject: z.string().trim().min(2, "Escolha um assunto.").max(120),
  message: z.string().trim().min(10, "Escreva pelo menos 10 caracteres.").max(2000, "Máximo de 2.000 caracteres."),
});

/** Turns zod issues into a { field: message } map (first message per field). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Only same-origin relative paths are allowed as post-login destinations. */
export function safeRedirect(value: unknown, fallback = "/app"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

/** Maps auth provider errors to Portuguese messages without leaking internals. */
export function authErrorMessage(error: { message?: string; code?: string } | null | undefined): string {
  const msg = (error?.message ?? "").toLowerCase();
  const code = error?.code ?? "";
  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (code === "email_not_confirmed" || msg.includes("email not confirmed"))
    return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (code === "user_already_exists" || msg.includes("already registered")) return "Já existe uma conta com este e-mail.";
  if (code === "weak_password" || msg.includes("pwned") || msg.includes("weak"))
    return "Esta senha é fraca ou apareceu em vazamentos conhecidos. Escolha outra.";
  if (code === "same_password" || msg.includes("should be different")) return "A nova senha precisa ser diferente da atual.";
  if (code === "current_password_mismatch" || msg.includes("current password")) return "A senha atual está incorreta.";
  if (code === "over_email_send_rate_limit" || msg.includes("rate limit"))
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  if (msg.includes("session") && msg.includes("missing")) return "Sua sessão expirou. Solicite um novo link.";
  return "Não foi possível concluir a operação. Tente novamente.";
}
