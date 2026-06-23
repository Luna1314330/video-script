-- 核心业务表结构（Supabase SQL Editor 执行）
-- 若已有旧表，请先备份数据，再按需执行下方迁移段落

-- ── user_profiles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL UNIQUE,
  nickname VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_profiles_phone_idx ON public.user_profiles (phone);

-- ── memberships（每用户一条，仅存当前状态）────────────────
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'free'
    CHECK (status IN ('free', 'active', 'expired', 'cancelled')),
  plan_type VARCHAR(20) DEFAULT NULL
    CHECK (plan_type IS NULL OR plan_type IN ('monthly', 'quarterly', 'yearly')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS memberships_user_id_idx ON public.memberships (user_id);
CREATE INDEX IF NOT EXISTS memberships_status_idx ON public.memberships (status);

-- ── orders（付费历史）──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  order_no VARCHAR(64) NOT NULL UNIQUE,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL
    CHECK (payment_method IN ('wechat', 'alipay', 'manual')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at);

-- ── 从旧表迁移（已有数据时按需执行）────────────────────────
-- user_profiles: email → phone
-- ALTER TABLE public.user_profiles RENAME COLUMN email TO phone;

-- memberships: 增加 starts_at，移除 created_at，每用户唯一
-- ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ DEFAULT NOW();
-- UPDATE public.memberships SET starts_at = COALESCE(created_at, NOW()) WHERE starts_at IS NULL;
-- ALTER TABLE public.memberships DROP COLUMN IF EXISTS created_at;
-- ALTER TABLE public.memberships DROP CONSTRAINT IF EXISTS memberships_user_id_unique;
-- ALTER TABLE public.memberships ADD CONSTRAINT memberships_user_id_unique UNIQUE (user_id);

-- orders: 移除 product_name，确保 order_no 存在
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_no VARCHAR(64);
-- UPDATE public.orders SET order_no = id::text WHERE order_no IS NULL;
-- ALTER TABLE public.orders ALTER COLUMN order_no SET NOT NULL;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS product_name;

-- 为已有用户补建 free 会员记录（无 memberships 行的用户）
-- INSERT INTO public.memberships (user_id, status, starts_at, expires_at)
-- SELECT p.id, 'free', p.created_at, NULL
-- FROM public.user_profiles p
-- LEFT JOIN public.memberships m ON m.user_id = p.id
-- WHERE m.id IS NULL;

-- memberships: 增加 plan_type（当前套餐：monthly / quarterly / yearly）
-- ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT NULL;
-- ALTER TABLE public.memberships DROP CONSTRAINT IF EXISTS memberships_plan_type_check;
-- ALTER TABLE public.memberships ADD CONSTRAINT memberships_plan_type_check
--   CHECK (plan_type IS NULL OR plan_type IN ('monthly', 'quarterly', 'yearly'));

-- orders: 支持 manual 支付方式（管理员手动开通）
-- ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
-- ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check
--   CHECK (payment_method IN ('wechat', 'alipay', 'manual'));

-- ── generation_logs（脚本生成额度扣减记录）────────────────
CREATE TABLE IF NOT EXISTS public.generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL DEFAULT 'script',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS generation_logs_user_created_idx
  ON public.generation_logs (user_id, created_at DESC);

ALTER TABLE public.generation_logs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.generation_logs TO anon, authenticated, service_role;

-- ── script_history（用户脚本生成记录）──────────────────────
CREATE TABLE IF NOT EXISTS public.script_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  industry VARCHAR(100) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  product_desc TEXT,
  shoot_scene TEXT,
  topic TEXT NOT NULL,
  generated_script TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS script_history_user_id_idx ON public.script_history (user_id);
CREATE INDEX IF NOT EXISTS script_history_created_at_idx ON public.script_history (created_at DESC);

ALTER TABLE public.script_history DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.script_history TO anon, authenticated, service_role;

ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.user_profiles TO anon, authenticated, service_role;
GRANT ALL ON public.memberships TO anon, authenticated, service_role;
GRANT ALL ON public.orders TO anon, authenticated, service_role;
