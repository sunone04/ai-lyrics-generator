-- 简化的pg_cron定时清理设置

-- 删除现有任务（如果存在）
SELECT cron.unschedule('daily_cleanup');

-- 创建每日清理任务（凌晨2点执行）
SELECT cron.schedule(
  'daily_cleanup',
  '0 2 * * *',
  'DELETE FROM generations WHERE is_favorited = FALSE AND created_at < NOW() - INTERVAL ''24 hours''; DELETE FROM user_sessions WHERE last_activity < NOW() - INTERVAL ''7 days''; DELETE FROM api_usage_logs WHERE created_at < NOW() - INTERVAL ''30 days'';'
);
