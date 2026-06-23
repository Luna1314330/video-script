-- 系统设置表（Key-Value JSON 存储）
-- 在 Supabase Dashboard → SQL Editor 中执行

CREATE TABLE IF NOT EXISTS public.system_settings (
  id VARCHAR(50) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS system_settings_id_idx ON public.system_settings (id);

COMMENT ON TABLE public.system_settings IS '系统配置：membership_pricing / site_settings';
COMMENT ON COLUMN public.system_settings.id IS '配置键名';
COMMENT ON COLUMN public.system_settings.value IS '配置 JSON 值';

-- 与现有表一致：不启用 RLS（Table Editor 显示 UNRESTRICTED）
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.system_settings TO anon, authenticated, service_role;

-- 默认配置：月卡 29 元，季卡/年卡未开放，非会员每日 1 次，仅微信支付
INSERT INTO public.system_settings (id, value) VALUES
(
  'membership_pricing',
  '{
    "monthly": { "price": 9.9, "originalPrice": 29, "enabled": true },
    "quarterly": { "price": 99, "originalPrice": 99, "enabled": false },
    "yearly": { "price": 299, "originalPrice": 299, "enabled": false }
  }'::jsonb
),
(
  'site_settings',
  '{
    "free_generations": 1,
    "member_generations": 20,
    "payment_methods": { "wechat": true, "alipay": false },
    "sms_notification": false,
    "customer_service_wechat": ""
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 已有 membership_pricing 数据时补全 originalPrice（未设置时与 price 相同）：
-- UPDATE public.system_settings
-- SET value = jsonb_set(
--   value,
--   '{monthly,originalPrice}',
--   COALESCE(value #> '{monthly,originalPrice}', value #> '{monthly,price}', '29'),
--   true
-- ),
-- updated_at = NOW()
-- WHERE id = 'membership_pricing';

-- 已有 site_settings 数据时，补全 member_generations 字段：
-- UPDATE public.system_settings
-- SET value = value || '{"member_generations": 20}'::jsonb,
--     updated_at = NOW()
-- WHERE id = 'site_settings'
--   AND NOT (value ? 'member_generations');

-- 已有 site_settings 数据时，补全 customer_service_wechat 字段：
-- UPDATE public.system_settings
-- SET value = value || '{"customer_service_wechat": ""}'::jsonb,
--     updated_at = NOW()
-- WHERE id = 'site_settings'
--   AND NOT (value ? 'customer_service_wechat');
