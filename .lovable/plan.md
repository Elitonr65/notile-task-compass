# NOTILE Task Manager — Plano de transformação em SaaS

## 1. Análise do projeto atual

**Tecnologias:** React 19 + TypeScript, Vite, Tailwind CSS v4, componentes reutilizáveis (shadcn/Radix), TanStack Start (roteamento e funções de servidor). Já é compatível com o que foi pedido.

**Funcionalidades existentes (serão preservadas e ampliadas):**
- Dashboard com total, pendentes, concluídas, atrasadas e progresso.
- Cadastro de tarefas (título, descrição, vencimento, prioridade baixa/média/alta).
- Lista com filtros Todas/Pendentes/Concluídas, concluir e excluir com confirmação.
- Menu lateral responsivo, avisos de confirmação, estados vazios e de carregamento.
- Regras de negócio isoladas e cobertas por 8 testes automatizados.

**Problemas e riscos identificados:**
- Dados ficam só no navegador: não há contas, empresas nem compartilhamento, e os dados se perdem se o navegador for limpo.
- Sem autenticação, permissões nem isolamento entre empresas.
- O modelo de tarefa não tem status, responsável, categoria nem prioridade "Urgente".
- O símbolo atual no menu foi criado provisoriamente. Ele será **removido** e substituído por um espaço reservado para o logotipo oficial.
- Hoje o dashboard ocupa a página inicial. No SaaS, a página inicial passa a ser a página institucional e o app vai para `/app` (**alteração estrutural que precisa da sua aprovação**).

## 2. Arquitetura proposta

```text
Público (sem login)            Área logada (/app, protegida)        Admin da plataforma
/            institucional     /app            dashboard            /admin  empresas
/precos      planos            /app/tarefas    lista + filtros      /admin/planos
/contato     formulário        /app/tarefas/nova | /$id editar
/termos  /privacidade          /app/categorias  /app/equipe
/entrar  /cadastro             /app/relatorios  /app/notificacoes
/esqueci-senha /redefinir-senha /app/perfil  /app/empresa (dados + plano)
```

**Organização do código:** `routes/` (telas), `components/` (interface reutilizável), `services/` (acesso a dados), `lib/domain/` (regras de negócio puras + testes), `lib/validation/` (esquemas compartilhados entre navegador e servidor), `lib/auth/`, `config/` (planos, permissões), migrations versionadas do banco.

**Banco de dados (Lovable Cloud, PostgreSQL):**
- `companies`: empresas.
- `profiles`: nome, foto e telefone do usuário.
- `company_members`: vínculo usuário–empresa com papel (admin da empresa, gestor, colaborador).
- `platform_roles`: administrador da plataforma, em tabela separada por segurança.
- `categories`: por empresa.
- `tasks`: título, descrição, responsável, categoria, prioridade (baixa, média, alta, urgente), status (pendente, em andamento, concluída, cancelada), prazo, criação, conclusão e empresa.
- `task_history`: histórico automático de alterações.
- `audit_logs`: operações importantes (membros, papéis, plano).
- `notifications`: com chave única para evitar duplicidade e canal (app; e-mail e WhatsApp no futuro).
- `plans`: FREE, PRO e BUSINESS com limites configuráveis. O preço fica vazio até aprovação.
- `subscriptions`: plano, status, contratação, renovação e cancelamento.
- `invitations` e `contact_messages`.

Tudo terá chaves estrangeiras, índices, restrições e políticas RLS. Cada consulta é filtrada **no banco** pela empresa do usuário, então uma empresa nunca vê dados de outra.

**Permissões (RBAC):**

| Ação | Colaborador | Gestor | Admin empresa | Admin plataforma |
|---|---|---|---|---|
| Ver tarefas da empresa | sim* | sim | sim | não |
| Criar tarefas | sim | sim | sim | não |
| Editar/excluir qualquer tarefa | só as próprias | sim | sim | não |
| Categorias e relatórios | ver | gerenciar | gerenciar | não |
| Membros, papéis e plano | não | não | sim | não |
| Planos e empresas da plataforma | não | não | não | sim |

\* Conforme sua resposta à pergunta sobre o colaborador.

## 3. Fases de implementação

**Fase 1 — Identidade e páginas públicas (~10%)**
Nova paleta (#101B2D, #4A010E, #FEF2E0, #FFFFFF, #64748B), espaço do logotipo, tela de carregamento, página institucional, preços (sem valores, "sob consulta"), contato, termos de uso e política de privacidade. Os textos jurídicos serão modelos marcados para revisão jurídica.

**Fase 2 — Contas e empresas (~25%)**
Ativar Lovable Cloud, cadastro (cria empresa + plano FREE), login, logout, recuperação e alteração de senha, perfil, sessão e proteção de rotas.

**Fase 3 — Tarefas no banco (~45%)**
Criar, editar, duplicar, excluir, concluir, atribuir responsável, categorias, busca e filtros (status, prioridade, período, responsável), visão de atrasadas, histórico e importação das tarefas do navegador.

**Fase 4 — Equipe e permissões (~60%)**
Convites por link, gestão de papéis, permissões aplicadas no banco e painel do administrador da plataforma.

**Fase 5 — Dashboard empresarial e relatórios (~72%)**
Indicadores reais (total, pendentes, em andamento, concluídas, atrasadas), produtividade por colaborador, gráficos e filtros por período e responsável. Relatórios avançados liberados conforme o plano.

**Fase 6 — Planos e assinaturas (~82%)**
Limites aplicados pelo banco (ex.: tarefas e membros), tela "Meu plano" e solicitação de upgrade registrada para a equipe comercial. Sem cobrança e sem simular pagamento aprovado.

**Fase 7 — Notificações (~90%)**
Nova tarefa atribuída e tarefa concluída (automáticas), prazo próximo e atrasada (verificação diária), central de notificações e proteção contra duplicidade. Estrutura pronta para e-mail e WhatsApp.

**Fase 8 — Homologação (~100% do escopo técnico)**
Testes automatizados de regras; testes de isolamento RLS com duas empresas de teste; testes no navegador de cadastro, login, recuperação de senha, tarefas, filtros, permissões e persistência, em celular, tablet e computador; varredura de segurança; relatório em `docs/homologacao.md`.

Ao fim de cada fase apresento: o que foi feito, arquivos alterados, testes executados, problemas, pendências e percentual.

## 4. Itens que dependem de serviços externos ou de você

- **Logotipo oficial:** envio do arquivo (favicon só depois dele).
- **Preços dos planos:** aprovação administrativa.
- **Pagamentos:** integração futura (Stripe ou Paddle) só com sua autorização.
- **E-mails com a marca NOTILE:** a recuperação de senha funciona com e-mails padrão; e-mails personalizados exigem um domínio de e-mail próprio.
- **WhatsApp:** exige um provedor externo contratado.
- **Domínio personalizado:** conectado nas configurações do projeto após a publicação.
- **Termos e privacidade:** revisão por advogado antes do lançamento.

## 5. Aprovações solicitadas

1. Mover o app para `/app` e usar `/` como página institucional.
2. Remover o símbolo provisório e usar o espaço reservado para o logotipo.
3. Ativar o Lovable Cloud (banco PostgreSQL, autenticação e segurança por linha).
4. Começar pelas Fases 1 e 2 nesta etapa; as demais seguem uma por vez, com relatório.

Observação: o produto só será considerado apto para lançamento após a homologação da Fase 8 e a resolução das pendências externas acima.
