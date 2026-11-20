import { describe, expect, it } from "vitest";
import { authErrorMessage, changePasswordSchema, passwordSchema, safeRedirect, signUpSchema } from "./auth";

describe("regras de senha", () => {
  it("exige ao menos 8 caracteres, uma letra e um número", () => {
    expect(passwordSchema.safeParse("abc1234").success).toBe(false);
    expect(passwordSchema.safeParse("abcdefgh").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
    expect(passwordSchema.safeParse("abcd1234").success).toBe(true);
  });

  it("alteração de senha exige senha nova diferente da atual", () => {
    const r = changePasswordSchema.safeParse({ currentPassword: "abcd1234", password: "abcd1234", confirmPassword: "abcd1234" });
    expect(r.success).toBe(false);
  });
});

describe("cadastro", () => {
  const valid = {
    fullName: "Ana Souza",
    companyName: "Acme",
    email: "ana@acme.com",
    password: "abcd1234",
    confirmPassword: "abcd1234",
    acceptTerms: true as const,
  };
  it("aceita dados válidos", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });
  it("exige aceite dos termos", () => {
    expect(signUpSchema.safeParse({ ...valid, acceptTerms: false }).success).toBe(false);
  });
  it("exige confirmação de senha igual", () => {
    expect(signUpSchema.safeParse({ ...valid, confirmPassword: "outra123" }).success).toBe(false);
  });
});

describe("redirecionamento após login", () => {
  it("aceita apenas caminhos internos", () => {
    expect(safeRedirect("/app/tarefas")).toBe("/app/tarefas");
    expect(safeRedirect("https://malicioso.com")).toBe("/app");
    expect(safeRedirect("//malicioso.com")).toBe("/app");
    expect(safeRedirect(undefined)).toBe("/app");
  });
});

describe("mensagens de erro", () => {
  it("traduz credenciais inválidas", () => {
    expect(authErrorMessage({ message: "Invalid login credentials" })).toBe("E-mail ou senha incorretos.");
  });
});
