-- ===== Enums =====
CREATE TYPE public.member_role AS ENUM ('company_admin', 'manager', 'collaborator');
CREATE TYPE public.app_role AS ENUM ('platform_admin');
CREATE TYPE public.subscription_status AS ENUM ('pending', 'trialing', 'active', 'past_due', 'canceled');

-- ===== Shared trigger: updated_at =====
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- ===== profiles =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '' CHECK (char_length(full_name) <= 120),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 30),
  avatar_url text CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 500),
  terms_version text CHECK (terms_version IS NULL OR char_length(terms_version) <= 20),
  terms_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- ===== companies =====
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

-- ===== company_members =====
CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'collaborator',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);
CREATE INDEX company_members_user_id_idx ON public.company_members(user_id);
GRANT SELECT ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;

-- ===== user_roles (platform-level roles, separate table) =====
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- ===== plans =====
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z][A-Z0-9_]{1,30}$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  max_tasks integer CHECK (max_tasks IS NULL OR max_tasks > 0),
  max_members integer CHECK (max_members IS NULL OR max_members > 0),
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  price_monthly_cents integer CHECK (price_monthly_cents IS NULL OR price_monthly_cents >= 0),
  currency text NOT NULL DEFAULT 'BRL' CHECK (char_length(currency) = 3),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;

-- ===== subscriptions =====
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  status public.subscription_status NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  renews_at timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  provider text CHECK (provider IS NULL OR char_length(provider) <= 30),
  provider_subscription_id text CHECK (provider_subscription_id IS NULL OR char_length(provider_subscription_id) <= 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_plan_id_idx ON public.subscriptions(plan_id);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

-- ===== audit_logs =====
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL CHECK (char_length(action) BETWEEN 3 AND 80),
  entity text CHECK (entity IS NULL OR char_length(entity) <= 60),
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_company_created_idx ON public.audit_logs(company_id, created_at DESC);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- ===== contact_messages =====
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  company text CHECK (company IS NULL OR char_length(company) <= 120),
  subject text NOT NULL CHECK (char_length(trim(subject)) BETWEEN 2 AND 120),
  message text NOT NULL CHECK (char_length(trim(message)) BETWEEN 10 AND 2000),
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'em_atendimento', 'respondido', 'arquivado')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contact_messages_created_idx ON public.contact_messages(created_at DESC);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

-- ===== Security helper functions (SECURITY DEFINER avoids recursive RLS) =====
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'platform_admin')
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(_company_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.company_members WHERE company_id = _company_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.has_company_role(_company_id uuid, _user_id uuid, _roles public.member_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = _company_id AND user_id = _user_id AND role = ANY(_roles)
  )
$$;

CREATE OR REPLACE FUNCTION public.shares_company(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members m1
    JOIN public.company_members m2 ON m1.company_id = m2.company_id
    WHERE m1.user_id = _a AND m2.user_id = _b
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_company_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_company_role(uuid, uuid, public.member_role[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.shares_company(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_company_role(uuid, uuid, public.member_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_company(uuid, uuid) TO authenticated;

-- ===== RLS =====
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Profiles: read own or same company" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.shares_company(auth.uid(), id) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "Profiles: insert own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Profiles: update own" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- companies
CREATE POLICY "Companies: members read" ON public.companies
  FOR SELECT TO authenticated
  USING (public.is_company_member(id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "Companies: company admins update" ON public.companies
  FOR UPDATE TO authenticated
  USING (public.has_company_role(id, auth.uid(), ARRAY['company_admin']::public.member_role[]))
  WITH CHECK (public.has_company_role(id, auth.uid(), ARRAY['company_admin']::public.member_role[]));

-- company_members
CREATE POLICY "Members: read same company" ON public.company_members
  FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- user_roles
CREATE POLICY "User roles: read own" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- plans
CREATE POLICY "Plans: anyone reads active" ON public.plans
  FOR SELECT TO anon, authenticated USING (is_active OR public.is_platform_admin(auth.uid()));

-- subscriptions
CREATE POLICY "Subscriptions: members read" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid()));

-- audit_logs
CREATE POLICY "Audit: company admins and platform admins read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    public.is_platform_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.has_company_role(company_id, auth.uid(), ARRAY['company_admin']::public.member_role[]))
  );

-- contact_messages
CREATE POLICY "Contact: anyone can send" ON public.contact_messages
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'novo');
CREATE POLICY "Contact: platform admins read" ON public.contact_messages
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "Contact: platform admins update" ON public.contact_messages
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- ===== updated_at triggers =====
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER company_members_updated_at BEFORE UPDATE ON public.company_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Company name changes are logged =====
CREATE OR REPLACE FUNCTION public.log_company_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    INSERT INTO public.audit_logs(company_id, actor_id, action, entity, entity_id, details)
    VALUES (NEW.id, auth.uid(), 'company.renamed', 'company', NEW.id,
            jsonb_build_object('from', OLD.name, 'to', NEW.name));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER companies_log_update AFTER UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.log_company_update();

-- ===== Plan configuration (prices intentionally NULL until approved) =====
INSERT INTO public.plans (code, name, description, max_tasks, max_members, features, sort_order) VALUES
  ('FREE', 'Free', 'Para uso individual com os recursos essenciais.', 50, 1,
   '["Até 50 tarefas", "1 usuário", "Painel de indicadores", "Categorias e prioridades"]'::jsonb, 1),
  ('PRO', 'Pro', 'Mais capacidade, relatórios avançados e recursos de produtividade.', 1000, 5,
   '["Até 1.000 tarefas", "Até 5 usuários", "Relatórios avançados", "Notificações de prazos", "Gestão ampliada"]'::jsonb, 2),
  ('BUSINESS', 'Business', 'Para empresas com equipes e administração centralizada.', NULL, NULL,
   '["Tarefas ilimitadas", "Colaboradores ilimitados", "Gestão de equipes e permissões", "Relatórios empresariais", "Administração centralizada"]'::jsonb, 3);

-- ===== Signup: profile + own company + FREE subscription =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name text;
  v_company text;
  v_terms text;
  v_company_id uuid;
  v_plan_id uuid;
BEGIN
  v_name := left(coalesce(
    nullif(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(NEW.raw_user_meta_data->>'name'), ''),
    split_part(coalesce(NEW.email, ''), '@', 1)
  ), 120);
  v_company := left(coalesce(nullif(trim(NEW.raw_user_meta_data->>'company_name'), ''), v_name), 120);
  IF v_company IS NULL OR char_length(v_company) < 2 THEN
    v_company := 'Minha empresa';
  END IF;
  v_terms := left(nullif(trim(NEW.raw_user_meta_data->>'terms_version'), ''), 20);

  INSERT INTO public.profiles (id, full_name, terms_version, terms_accepted_at)
  VALUES (NEW.id, coalesce(v_name, ''), v_terms, CASE WHEN v_terms IS NOT NULL THEN now() END);

  INSERT INTO public.companies (name, created_by) VALUES (v_company, NEW.id) RETURNING id INTO v_company_id;
  INSERT INTO public.company_members (company_id, user_id, role) VALUES (v_company_id, NEW.id, 'company_admin');

  SELECT id INTO v_plan_id FROM public.plans WHERE code = 'FREE';
  INSERT INTO public.subscriptions (company_id, plan_id, status) VALUES (v_company_id, v_plan_id, 'active');

  INSERT INTO public.audit_logs (company_id, actor_id, action, entity, entity_id, details)
  VALUES (v_company_id, NEW.id, 'company.created', 'company', v_company_id, jsonb_build_object('plan', 'FREE'));
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();