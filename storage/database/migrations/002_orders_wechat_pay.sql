-- 已有库升级：为微信支付订单履约增加字段
-- 若列已存在，请跳过对应语句

ALTER TABLE orders ADD COLUMN plan_type VARCHAR(20) DEFAULT NULL AFTER amount;
ALTER TABLE orders ADD COLUMN wechat_transaction_id VARCHAR(64) DEFAULT NULL AFTER payment_method;
