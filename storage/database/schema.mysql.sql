-- 腾讯云 MySQL 建表脚本（脚本工坊）
-- 在数据库控制台 SQL 窗口执行

CREATE TABLE IF NOT EXISTS user_profiles (
  id            CHAR(36) PRIMARY KEY,
  phone         VARCHAR(20) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname      VARCHAR(50),
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX user_profiles_phone_idx (phone)
);

CREATE TABLE IF NOT EXISTS memberships (
  id         CHAR(36) PRIMARY KEY,
  user_id    CHAR(36) NOT NULL UNIQUE,
  status     VARCHAR(20) NOT NULL DEFAULT 'free',
  plan_type  VARCHAR(20) DEFAULT NULL,
  starts_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME DEFAULT NULL,
  INDEX memberships_user_id_idx (user_id),
  INDEX memberships_status_idx (status)
);

CREATE TABLE IF NOT EXISTS orders (
  id              CHAR(36) PRIMARY KEY,
  user_id         CHAR(36) NOT NULL,
  order_no                VARCHAR(64) NOT NULL UNIQUE,
  amount                  DECIMAL(10, 2) NOT NULL,
  plan_type               VARCHAR(20) DEFAULT NULL,
  payment_method          VARCHAR(20) NOT NULL,
  wechat_transaction_id   VARCHAR(64) DEFAULT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  paid_at         DATETIME DEFAULT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX orders_user_id_idx (user_id),
  INDEX orders_status_idx (status),
  INDEX orders_created_at_idx (created_at)
);

CREATE TABLE IF NOT EXISTS generation_logs (
  id         CHAR(36) PRIMARY KEY,
  user_id    CHAR(36) NOT NULL,
  action     VARCHAR(20) NOT NULL DEFAULT 'script',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX generation_logs_user_created_idx (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS script_history (
  id               CHAR(36) PRIMARY KEY,
  user_id          CHAR(36) NOT NULL,
  industry         VARCHAR(100) NOT NULL,
  product_name     VARCHAR(200) NOT NULL,
  product_desc     TEXT,
  shoot_scene      TEXT,
  topic            TEXT NOT NULL,
  generated_script TEXT,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX script_history_user_id_idx (user_id),
  INDEX script_history_created_at_idx (created_at)
);

CREATE TABLE IF NOT EXISTS system_settings (
  id         VARCHAR(50) PRIMARY KEY,
  value      JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX system_settings_id_idx (id)
);

INSERT INTO system_settings (id, value) VALUES
(
  'membership_pricing',
  JSON_OBJECT(
    'monthly', JSON_OBJECT('price', 9.9, 'originalPrice', 29, 'enabled', true),
    'quarterly', JSON_OBJECT('price', 99, 'originalPrice', 99, 'enabled', false),
    'yearly', JSON_OBJECT('price', 299, 'originalPrice', 299, 'enabled', false)
  )
),
(
  'site_settings',
  JSON_OBJECT(
    'free_generations', 1,
    'member_generations', 20,
    'payment_methods', JSON_OBJECT('wechat', false, 'alipay', false),
    'membership_purchase_enabled', false,
    'sms_notification', false,
    'customer_service_wechat', ''
  )
)
ON DUPLICATE KEY UPDATE id = id;
