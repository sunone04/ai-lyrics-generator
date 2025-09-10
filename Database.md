目前的Supabase数据库已经包含了以下全部内容：
表：
[
  {
    "table_name": "audit_log_entries",
    "schema": "auth"
  },
  {
    "table_name": "flow_state",
    "schema": "auth"
  },
  {
    "table_name": "identities",
    "schema": "auth"
  },
  {
    "table_name": "instances",
    "schema": "auth"
  },
  {
    "table_name": "mfa_amr_claims",
    "schema": "auth"
  },
  {
    "table_name": "mfa_challenges",
    "schema": "auth"
  },
  {
    "table_name": "mfa_factors",
    "schema": "auth"
  },
  {
    "table_name": "oauth_clients",
    "schema": "auth"
  },
  {
    "table_name": "one_time_tokens",
    "schema": "auth"
  },
  {
    "table_name": "refresh_tokens",
    "schema": "auth"
  },
  {
    "table_name": "saml_providers",
    "schema": "auth"
  },
  {
    "table_name": "saml_relay_states",
    "schema": "auth"
  },
  {
    "table_name": "schema_migrations",
    "schema": "auth"
  },
  {
    "table_name": "sessions",
    "schema": "auth"
  },
  {
    "table_name": "sso_domains",
    "schema": "auth"
  },
  {
    "table_name": "sso_providers",
    "schema": "auth"
  },
  {
    "table_name": "users",
    "schema": "auth"
  },
  {
    "table_name": "job",
    "schema": "cron"
  },
  {
    "table_name": "job_run_details",
    "schema": "cron"
  },
  {
    "table_name": "api_usage_logs",
    "schema": "public"
  },
  {
    "table_name": "categories",
    "schema": "public"
  },
  {
    "table_name": "generations",
    "schema": "public"
  },
  {
    "table_name": "paddle_webhook_queue",
    "schema": "public"
  },
  {
    "table_name": "personal_style_groups",
    "schema": "public"
  },
  {
    "table_name": "personal_style_lyrics",
    "schema": "public"
  },
  {
    "table_name": "posts",
    "schema": "public"
  },
  {
    "table_name": "profiles",
    "schema": "public"
  },
  {
    "table_name": "user_sessions",
    "schema": "public"
  }
]

## 变更记录（2025-09-10）

为统一“收藏上限”逻辑并确保授权完整，已对如下函数进行更新：

- 将 `public.check_favorite_limit_optimized(uuid)` 统一为对 `public.check_favorite_limit_with_trial(uuid)` 的包装，以实时统计为准，避免因 `profiles.favorite_count` 未同步导致的误判。
- 为两个函数补充了执行权限授予（GRANT EXECUTE）。

最新函数定义（摘要）：

```
CREATE OR REPLACE FUNCTION public.check_favorite_limit_optimized(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT public.check_favorite_limit_with_trial(user_uuid);
$$;
```

已授予的执行权限：

```
GRANT EXECUTE ON FUNCTION public.check_favorite_limit_with_trial(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_favorite_limit_optimized(uuid) TO authenticated, service_role;
```

应用侧配套：代码已统一调用 `check_favorite_limit_with_trial`，`check_favorite_limit_optimized` 作为兼容入口存在但不再单独实现逻辑。



=============================
个人风格库（members-only）约束与优化
=============================

以下为为了实现“个人风格为会员专属、每组最多5首、每首≤500字符，并在生成时使用该分组全部样本”的数据库层最小约束与可选优化。均为幂等，多次执行安全。

一、最小必需（强约束，已执行）

作用：
- 仅会员（付费 active 或试用期内）可创建个人风格分组与样本；
- 每个分组最多 5 条样本；
- 每条样本 ≤500 字符，并将字符数写入 word_count（INSERT/UPDATE 都生效）。

SQL：

BEGIN;

-- 仅会员可创建分组
CREATE OR REPLACE FUNCTION public._ps_enforce_member_on_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prof public.profiles%ROWTYPE;
  in_trial boolean := false;
BEGIN
  SELECT * INTO prof FROM public.profiles WHERE id = NEW.user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found';
  END IF;

  -- 默认：付费 active 或试用期内 都算会员（如需“仅付费”，可去掉 in_trial 条件）
  SELECT public.is_user_in_trial_period(NEW.user_id) INTO in_trial;
  IF NOT (prof.status = 'active' OR in_trial) THEN
    RAISE EXCEPTION 'Personal style is members-only. Please subscribe.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ps_member_group ON public.personal_style_groups;
CREATE TRIGGER trg_ps_member_group
  BEFORE INSERT ON public.personal_style_groups
  FOR EACH ROW EXECUTE FUNCTION public._ps_enforce_member_on_group();

-- 仅会员可新增样本
CREATE OR REPLACE FUNCTION public._ps_enforce_member_on_lyrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prof public.profiles%ROWTYPE;
  in_trial boolean := false;
BEGIN
  SELECT * INTO prof FROM public.profiles WHERE id = NEW.user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found';
  END IF;

  SELECT public.is_user_in_trial_period(NEW.user_id) INTO in_trial;
  IF NOT (prof.status = 'active' OR in_trial) THEN
    RAISE EXCEPTION 'Personal style is members-only. Please subscribe.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ps_member_lyrics ON public.personal_style_lyrics;
CREATE TRIGGER trg_ps_member_lyrics
  BEFORE INSERT ON public.personal_style_lyrics
  FOR EACH ROW EXECUTE FUNCTION public._ps_enforce_member_on_lyrics();

-- 每个分组最多 5 条样本
CREATE OR REPLACE FUNCTION public._ps_enforce_group_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cnt int;
BEGIN
  SELECT count(*) INTO cnt
  FROM public.personal_style_lyrics
  WHERE style_group_id = NEW.style_group_id
    AND user_id = NEW.user_id;

  IF cnt >= 5 THEN
    RAISE EXCEPTION 'This style group already has 5 samples.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ps_group_limit ON public.personal_style_lyrics;
CREATE TRIGGER trg_ps_group_limit
  BEFORE INSERT ON public.personal_style_lyrics
  FOR EACH ROW EXECUTE FUNCTION public._ps_enforce_group_limit();

-- 每条样本 ≤500 字符，并统一写入 word_count=字符数（INSERT/UPDATE）
CREATE OR REPLACE FUNCTION public._ps_enforce_lyrics_len_and_wc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  len int;
BEGIN
  len := char_length(coalesce(NEW.lyrics, ''));
  IF len > 500 THEN
    RAISE EXCEPTION 'Lyric too long (max 500 characters).';
  END IF;
  NEW.word_count := len;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ps_lyrics_len_wc_ins ON public.personal_style_lyrics;
CREATE TRIGGER trg_ps_lyrics_len_wc_ins
  BEFORE INSERT ON public.personal_style_lyrics
  FOR EACH ROW EXECUTE FUNCTION public._ps_enforce_lyrics_len_and_wc();

DROP TRIGGER IF EXISTS trg_ps_lyrics_len_wc_upd ON public.personal_style_lyrics;
CREATE TRIGGER trg_ps_lyrics_len_wc_upd
  BEFORE UPDATE ON public.personal_style_lyrics
  FOR EACH ROW EXECUTE FUNCTION public._ps_enforce_lyrics_len_and_wc();

COMMIT;

二、可选优化（按需执行）

目的：加速“按分组取样本、按时间倒序”的查询，减少聚合/扫描。

SQL：

CREATE INDEX IF NOT EXISTS idx_psl_group_created
  ON public.personal_style_lyrics (style_group_id, created_at DESC);

说明：
- 若你希望“仅付费会员（不含试用）”可用，将上面两个会员函数里的判断从
  IF NOT (prof.status = 'active' OR in_trial) THEN
  改为
  IF prof.status <> 'active' THEN
  然后重新执行这两段函数/触发器即可；
- 本节约束与现有 RLS（只能操作自己的数据）配合使用，形成 UI/接口/DB 三层一致的生产级安全与成本控制。



profiles表：
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "email",
    "data_type": "character varying",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "column_comment": null
  },
  {
    "column_name": "paddle_customer_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": "'free'::subscription_status",
    "column_comment": null
  },
  {
    "column_name": "active_price_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "generation_count",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "0",
    "column_comment": null
  },
  {
    "column_name": "rewrite_count",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "0",
    "column_comment": null
  },
  {
    "column_name": "favorite_count",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "0",
    "column_comment": null
  },
  {
    "column_name": "is_admin",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "false",
    "column_comment": null
  },
  {
    "column_name": "last_login_ip",
    "data_type": "inet",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "last_login_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "browser_fingerprint",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "subscription_end_date",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "subscription_plan_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "subscription_billing_cycle",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "paddle_subscription_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "subscription_start_date",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "next_billing_date",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "subscription_canceled_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "trial_start_date",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "trial_end_date",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "is_trial_used",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false",
    "column_comment": null
  }
]



generations 表结构：
[
  {
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "column_comment": null
  },
  {
    "column_name": "language",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "music_style",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "music_theme",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "length_option",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "lyric_style",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "intent_or_request",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "artist_style",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "emotion_intensity",
    "data_type": "smallint",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "rhyme_requirement",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "song_structure",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "paragraph_length",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "sentence_preference",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "bpm",
    "data_type": "smallint",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "generated_lyrics",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "model_used",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "is_favorited",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "false",
    "column_comment": null
  },
  {
    "column_name": "generation_type",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": "'full'::generation_type",
    "column_comment": null
  },
  {
    "column_name": "parent_generation_id",
    "data_type": "bigint",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "optimization_request",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "melody",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "syllable_pattern",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "personal_style_group_id",
    "data_type": "bigint",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  }
]



posts 表结构：
[
  {
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "column_comment": null
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "column_comment": null
  },
  {
    "column_name": "category_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "title",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "content",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "column_default": "'draft'::post_status",
    "column_comment": null
  },
  {
    "column_name": "slug",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "seo_title",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "meta_description",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "featured_image",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "excerpt",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "view_count",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "0",
    "column_comment": null
  },
  {
    "column_name": "published_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  }
]



categories 表结构：
[
  {
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "column_comment": null
  },
  {
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "slug",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "seo_title",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "meta_description",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "sort_order",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "0",
    "column_comment": null
  },
  {
    "column_name": "is_active",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "true",
    "column_comment": null
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "column_comment": null
  }
]



personal_style_groups 表结构：
[
  {
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": "nextval('personal_style_groups_id_seq'::regclass)",
    "column_comment": null
  },
  {
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "column_comment": null
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "column_comment": null
  }
]



personal_style_lyrics 表结构：
[
  {
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": "nextval('personal_styles_id_seq'::regclass)",
    "column_comment": null
  },
  {
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "title",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "lyrics",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "music_style",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "language",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'English'::text",
    "column_comment": null
  },
  {
    "column_name": "word_count",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "column_comment": null
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "column_comment": null
  },
  {
    "column_name": "style_group_id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  }
]




paddle_webhook_queue 表结构：
[
  {
    "column_name": "id",
    "data_type": "bigint",
    "is_nullable": "NO",
    "column_default": "nextval('paddle_webhook_queue_id_seq'::regclass)",
    "column_comment": null
  },
  {
    "column_name": "event_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "event_type",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "payload",
    "data_type": "jsonb",
    "is_nullable": "NO",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "received_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()",
    "column_comment": null
  },
  {
    "column_name": "attempts",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "0",
    "column_comment": null
  },
  {
    "column_name": "processed_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  },
  {
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'pending'::text",
    "column_comment": null
  },
  {
    "column_name": "error",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null,
    "column_comment": null
  }
]



外键约束
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name;执行结果：


[
  {
    "table_name": "api_usage_logs",
    "constraint_name": "api_usage_logs_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "user_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "generations",
    "constraint_name": "generations_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "user_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "generations",
    "constraint_name": "generations_parent_generation_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "parent_generation_id",
    "foreign_table_name": "generations",
    "foreign_column_name": "id"
  },
  {
    "table_name": "generations",
    "constraint_name": "generations_personal_style_group_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "personal_style_group_id",
    "foreign_table_name": "personal_style_groups",
    "foreign_column_name": "id"
  },
  {
    "table_name": "personal_style_groups",
    "constraint_name": "personal_style_groups_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "user_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "personal_style_lyrics",
    "constraint_name": "personal_styles_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "user_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "personal_style_lyrics",
    "constraint_name": "personal_style_lyrics_style_group_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "style_group_id",
    "foreign_table_name": "personal_style_groups",
    "foreign_column_name": "id"
  },
  {
    "table_name": "posts",
    "constraint_name": "posts_category_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "category_id",
    "foreign_table_name": "categories",
    "foreign_column_name": "id"
  },
  {
    "table_name": "user_sessions",
    "constraint_name": "user_sessions_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "user_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  }
]



查看所有索引：
[
  {
    "schema": "public",
    "table_name": "api_usage_logs",
    "index_name": "api_usage_logs_pkey",
    "index_definition": "CREATE UNIQUE INDEX api_usage_logs_pkey ON public.api_usage_logs USING btree (id)"
  },
  {
    "schema": "public",
    "table_name": "api_usage_logs",
    "index_name": "idx_api_usage_logs_created_at",
    "index_definition": "CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs USING btree (created_at)"
  },
  {
    "schema": "public",
    "table_name": "api_usage_logs",
    "index_name": "idx_api_usage_logs_endpoint",
    "index_definition": "CREATE INDEX idx_api_usage_logs_endpoint ON public.api_usage_logs USING btree (endpoint)"
  },
  {
    "schema": "public",
    "table_name": "api_usage_logs",
    "index_name": "idx_api_usage_logs_ip_address",
    "index_definition": "CREATE INDEX idx_api_usage_logs_ip_address ON public.api_usage_logs USING btree (ip_address)"
  },
  {
    "schema": "public",
    "table_name": "api_usage_logs",
    "index_name": "idx_api_usage_logs_user_id",
    "index_definition": "CREATE INDEX idx_api_usage_logs_user_id ON public.api_usage_logs USING btree (user_id)"
  },
  {
    "schema": "public",
    "table_name": "categories",
    "index_name": "categories_name_key",
    "index_definition": "CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name)"
  },
  {
    "schema": "public",
    "table_name": "categories",
    "index_name": "categories_pkey",
    "index_definition": "CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id)"
  },
  {
    "schema": "public",
    "table_name": "categories",
    "index_name": "categories_slug_key",
    "index_definition": "CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug)"
  },
  {
    "schema": "public",
    "table_name": "categories",
    "index_name": "idx_categories_is_active",
    "index_definition": "CREATE INDEX idx_categories_is_active ON public.categories USING btree (is_active)"
  },
  {
    "schema": "public",
    "table_name": "categories",
    "index_name": "idx_categories_slug",
    "index_definition": "CREATE INDEX idx_categories_slug ON public.categories USING btree (slug)"
  },
  {
    "schema": "public",
    "table_name": "categories",
    "index_name": "idx_categories_sort_order",
    "index_definition": "CREATE INDEX idx_categories_sort_order ON public.categories USING btree (sort_order)"
  },
  {
    "schema": "public",
    "table_name": "generations",
    "index_name": "generations_pkey",
    "index_definition": "CREATE UNIQUE INDEX generations_pkey ON public.generations USING btree (id)"
  },
  {
    "schema": "public",
    "table_name": "generations",
    "index_name": "idx_generations_generation_type",
    "index_definition": "CREATE INDEX idx_generations_generation_type ON public.generations USING btree (generation_type)"
  },
  {
    "schema": "public",
    "table_name": "generations",
    "index_name": "idx_generations_is_favorited",
    "index_definition": "CREATE INDEX idx_generations_is_favorited ON public.generations USING btree (is_favorited)"
  },
  {
    "schema": "public",
    "table_name": "generations",
    "index_name": "idx_generations_is_favorited_created_at",
    "index_definition": "CREATE INDEX idx_generations_is_favorited_created_at ON public.generations USING btree (is_favorited, created_at)"
  },
  {
    "schema": "public",
    "table_name": "generations",
    "index_name": "idx_generations_model_used",
    "index_definition": "CREATE INDEX idx_generations_model_used ON public.generations USING btree (model_used)"
  },
  {
    "schema": "public",
    "table_name": "generations",
    "index_name": "idx_generations_parent_generation_id",
    "index_definition": "CREATE INDEX idx_generations_parent_generation_id ON public.generations USING btree (parent_generation_id)"
  },
  {
    "schema": "public",
    "table_name": "generations",
    "index_name": "idx_generations_personal_style_id",
    "index_definition": "CREATE INDEX idx_generations_personal_style_id ON public.generations USING btree (personal_style_group_id)"
  },
  {
    "schema": "public",
    "table_name": "generations",
    "index_name": "idx_generations_user_favorited_created",
    "index_definition": "CREATE INDEX idx_generations_user_favorited_created ON public.generations USING btree (user_id, is_favorited, created_at DESC)"
  },
  {
    "schema": "public",
    "table_name": "generations",
    "index_name": "idx_generations_user_id_created_at",
    "index_definition": "CREATE INDEX idx_generations_user_id_created_at ON public.generations USING btree (user_id, created_at DESC)"
  },
  {
    "schema": "public",
    "table_name": "paddle_webhook_queue",
    "index_name": "idx_paddle_webhook_queue_status",
    "index_definition": "CREATE INDEX idx_paddle_webhook_queue_status ON public.paddle_webhook_queue USING btree (status, received_at)"
  },
  {
    "schema": "public",
    "table_name": "paddle_webhook_queue",
    "index_name": "paddle_webhook_queue_event_id_key",
    "index_definition": "CREATE UNIQUE INDEX paddle_webhook_queue_event_id_key ON public.paddle_webhook_queue USING btree (event_id)"
  },
  {
    "schema": "public",
    "table_name": "paddle_webhook_queue",
    "index_name": "paddle_webhook_queue_pkey",
    "index_definition": "CREATE UNIQUE INDEX paddle_webhook_queue_pkey ON public.paddle_webhook_queue USING btree (id)"
  },
  {
    "schema": "public",
    "table_name": "personal_style_groups",
    "index_name": "personal_style_groups_pkey",
    "index_definition": "CREATE UNIQUE INDEX personal_style_groups_pkey ON public.personal_style_groups USING btree (id)"
  },
  {
    "schema": "public",
    "table_name": "personal_style_groups",
    "index_name": "user_style_name_unique",
    "index_definition": "CREATE UNIQUE INDEX user_style_name_unique ON public.personal_style_groups USING btree (user_id, name)"
  },
  {
    "schema": "public",
    "table_name": "personal_style_lyrics",
    "index_name": "idx_personal_styles_created_at",
    "index_definition": "CREATE INDEX idx_personal_styles_created_at ON public.personal_style_lyrics USING btree (created_at DESC)"
  },
  {
    "schema": "public",
    "table_name": "personal_style_lyrics",
    "index_name": "idx_personal_styles_user_created_optimized",
    "index_definition": "CREATE INDEX idx_personal_styles_user_created_optimized ON public.personal_style_lyrics USING btree (user_id, created_at DESC)"
  },
  {
    "schema": "public",
    "table_name": "personal_style_lyrics",
    "index_name": "idx_personal_styles_user_id",
    "index_definition": "CREATE INDEX idx_personal_styles_user_id ON public.personal_style_lyrics USING btree (user_id)"
  },
  {
    "schema": "public",
    "table_name": "personal_style_lyrics",
    "index_name": "personal_styles_pkey",
    "index_definition": "CREATE UNIQUE INDEX personal_styles_pkey ON public.personal_style_lyrics USING btree (id)"
  },
  {
    "schema": "public",
    "table_name": "posts",
    "index_name": "idx_posts_category_id_status",
    "index_definition": "CREATE INDEX idx_posts_category_id_status ON public.posts USING btree (category_id, status)"
  },
  {
    "schema": "public",
    "table_name": "posts",
    "index_name": "idx_posts_created_at",
    "index_definition": "CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at DESC)"
  },
  {
    "schema": "public",
    "table_name": "posts",
    "index_name": "idx_posts_published_at",
    "index_definition": "CREATE INDEX idx_posts_published_at ON public.posts USING btree (published_at DESC)"
  },
  {
    "schema": "public",
    "table_name": "posts",
    "index_name": "idx_posts_status_slug",
    "index_definition": "CREATE INDEX idx_posts_status_slug ON public.posts USING btree (status, slug)"
  },
  {
    "schema": "public",
    "table_name": "posts",
    "index_name": "idx_posts_view_count",
    "index_definition": "CREATE INDEX idx_posts_view_count ON public.posts USING btree (view_count DESC)"
  },
  {
    "schema": "public",
    "table_name": "posts",
    "index_name": "posts_pkey",
    "index_definition": "CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (id)"
  },
  {
    "schema": "public",
    "table_name": "posts",
    "index_name": "posts_slug_key",
    "index_definition": "CREATE UNIQUE INDEX posts_slug_key ON public.posts USING btree (slug)"
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "index_name": "idx_profiles_email",
    "index_definition": "CREATE INDEX idx_profiles_email ON public.profiles USING btree (email)"
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "index_name": "idx_profiles_is_admin",
    "index_definition": "CREATE INDEX idx_profiles_is_admin ON public.profiles USING btree (is_admin)"
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "index_name": "idx_profiles_is_trial_used",
    "index_definition": "CREATE INDEX idx_profiles_is_trial_used ON public.profiles USING btree (is_trial_used)"
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "index_name": "idx_profiles_last_login_ip",
    "index_definition": "CREATE INDEX idx_profiles_last_login_ip ON public.profiles USING btree (last_login_ip)"
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "index_name": "idx_profiles_paddle_customer_id",
    "index_definition": "CREATE INDEX idx_profiles_paddle_customer_id ON public.profiles USING btree (paddle_customer_id)"
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "index_name": "idx_profiles_paddle_subscription_id",
    "index_definition": "CREATE INDEX idx_profiles_paddle_subscription_id ON public.profiles USING btree (paddle_subscription_id)"
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "index_name": "idx_profiles_status",
    "index_definition": "CREATE INDEX idx_profiles_status ON public.profiles USING btree (status)"
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "index_name": "idx_profiles_status_generation_count",
    "index_definition": "CREATE INDEX idx_profiles_status_generation_count ON public.profiles USING btree (status, generation_count)"
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "index_name": "idx_profiles_status_trial",
    "index_definition": "CREATE INDEX idx_profiles_status_trial ON public.profiles USING btree (status, is_trial_used, trial_end_date)"
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "index_name": "idx_profiles_status_trial_optimized",
    "index_definition": "CREATE INDEX idx_profiles_status_trial_optimized ON public.profiles USING btree (status, trial_start_date, trial_end_date, is_trial_used)"
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "index_name": "idx_profiles_subscription_end_date",
    "index_definition": "CREATE INDEX idx_profiles_subscription_end_date ON public.profiles USING btree (subscription_end_date)"
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "index_name": "idx_profiles_trial_end_date",
    "index_definition": "CREATE INDEX idx_profiles_trial_end_date ON public.profiles USING btree (trial_end_date)"
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "index_name": "idx_profiles_updated_at",
    "index_definition": "CREATE INDEX idx_profiles_updated_at ON public.profiles USING btree (updated_at)"
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "index_name": "profiles_paddle_customer_id_key",
    "index_definition": "CREATE UNIQUE INDEX profiles_paddle_customer_id_key ON public.profiles USING btree (paddle_customer_id)"
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "index_name": "profiles_pkey",
    "index_definition": "CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)"
  },
  {
    "schema": "public",
    "table_name": "user_sessions",
    "index_name": "idx_user_sessions_browser_fingerprint",
    "index_definition": "CREATE INDEX idx_user_sessions_browser_fingerprint ON public.user_sessions USING btree (browser_fingerprint)"
  },
  {
    "schema": "public",
    "table_name": "user_sessions",
    "index_name": "idx_user_sessions_ip_address",
    "index_definition": "CREATE INDEX idx_user_sessions_ip_address ON public.user_sessions USING btree (ip_address)"
  },
  {
    "schema": "public",
    "table_name": "user_sessions",
    "index_name": "idx_user_sessions_is_active",
    "index_definition": "CREATE INDEX idx_user_sessions_is_active ON public.user_sessions USING btree (is_active)"
  },
  {
    "schema": "public",
    "table_name": "user_sessions",
    "index_name": "idx_user_sessions_last_activity",
    "index_definition": "CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions USING btree (last_activity)"
  },
  {
    "schema": "public",
    "table_name": "user_sessions",
    "index_name": "idx_user_sessions_user_id",
    "index_definition": "CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id)"
  },
  {
    "schema": "public",
    "table_name": "user_sessions",
    "index_name": "user_sessions_pkey",
    "index_definition": "CREATE UNIQUE INDEX user_sessions_pkey ON public.user_sessions USING btree (id)"
  },
  {
    "schema": "public",
    "table_name": "user_sessions",
    "index_name": "user_sessions_session_id_key",
    "index_definition": "CREATE UNIQUE INDEX user_sessions_session_id_key ON public.user_sessions USING btree (session_id)"
  }
]




查看所有触发器：
[
  {
    "trigger_name": "update_categories_updated_at_trigger",
    "table_name": "categories",
    "trigger_type_code": 19,
    "timing": "BEFORE",
    "events": "UPDATE",
    "function_name": "update_categories_updated_at"
  },
  {
    "trigger_name": "check_user_style_group_limit_trigger",
    "table_name": "personal_style_groups",
    "trigger_type_code": 7,
    "timing": "BEFORE",
    "events": "",
    "function_name": "check_user_style_group_limit"
  },
  {
    "trigger_name": "update_posts_updated_at",
    "table_name": "posts",
    "trigger_type_code": 19,
    "timing": "BEFORE",
    "events": "UPDATE",
    "function_name": "update_updated_at_column"
  }
]



查看所有用户自定义的函数和存储过程：
[
  {
    "schema_name": "public",
    "function_name": "activate_user_trial",
    "argument_types": "user_uuid uuid",
    "return_type": "boolean",
    "language": "plpgsql",
    "function_definition": "CREATE OR REPLACE FUNCTION public.activate_user_trial(user_uuid uuid)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nDECLARE\r\n    trial_start TIMESTAMPTZ;\r\n    trial_end TIMESTAMPTZ;\r\nBEGIN\r\n    -- 检查用户是否有试用权限\r\n    IF NOT can_user_use_trial(user_uuid) THEN\r\n        RETURN FALSE;\r\n    END IF;\r\n    \r\n    -- 设置试用期时间（3天）\r\n    trial_start := NOW();\r\n    trial_end := NOW() + INTERVAL '3 days';\r\n    \r\n    -- 更新用户试用期信息\r\n    UPDATE profiles \r\n    SET \r\n        trial_start_date = trial_start,\r\n        trial_end_date = trial_end,\r\n        is_trial_used = TRUE,\r\n        updated_at = NOW()\r\n    WHERE id = user_uuid;\r\n    \r\n    RETURN TRUE;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "can_user_use_trial",
    "argument_types": "user_uuid uuid",
    "return_type": "boolean",
    "language": "plpgsql",
    "function_definition": "CREATE OR REPLACE FUNCTION public.can_user_use_trial(user_uuid uuid)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nDECLARE\r\n    user_profile profiles%ROWTYPE;\r\nBEGIN\r\n    -- 获取用户信息\r\n    SELECT * INTO user_profile FROM profiles WHERE id = user_uuid;\r\n    \r\n    IF NOT FOUND THEN\r\n        RETURN FALSE;\r\n    END IF;\r\n    \r\n    -- 如果已经是付费用户，不需要试用\r\n    IF user_profile.status = 'active' THEN\r\n        RETURN FALSE;\r\n    END IF;\r\n    \r\n    -- 如果已经使用过试用期，不能再使用\r\n    IF user_profile.is_trial_used = TRUE THEN\r\n        RETURN FALSE;\r\n    END IF;\r\n    \r\n    -- 如果正在试用期内，可以继续使用\r\n    IF is_user_in_trial_period(user_uuid) THEN\r\n        RETURN TRUE;\r\n    END IF;\r\n    \r\n    -- 如果从未使用过试用期，可以使用\r\n    IF user_profile.trial_start_date IS NULL AND user_profile.trial_end_date IS NULL THEN\r\n        RETURN TRUE;\r\n    END IF;\r\n    \r\n    RETURN FALSE;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "check_favorite_limit_optimized",
    "argument_types": "user_uuid uuid",
    "return_type": "boolean",
    "language": "plpgsql",
    "function_definition": "CREATE OR REPLACE FUNCTION public.check_favorite_limit_optimized(user_uuid uuid)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nDECLARE\r\n    user_profile profiles%ROWTYPE;\r\n    max_favorites INTEGER;\r\nBEGIN\r\n    SELECT * INTO user_profile FROM profiles WHERE id = user_uuid;\r\n    \r\n    IF NOT FOUND THEN\r\n        RETURN FALSE;\r\n    END IF;\r\n    \r\n    IF user_profile.status = 'active' OR is_user_in_trial_period(user_uuid) THEN\r\n        max_favorites := 300;\r\n    ELSE\r\n        max_favorites := 3;\r\n    END IF;\r\n    \r\n    RETURN user_profile.favorite_count < max_favorites;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "check_favorite_limit_with_trial",
    "argument_types": "user_uuid uuid",
    "return_type": "boolean",
    "language": "plpgsql",
    "function_definition": "CREATE OR REPLACE FUNCTION public.check_favorite_limit_with_trial(user_uuid uuid)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nDECLARE\r\n    user_profile profiles%ROWTYPE;\r\n    current_favorites_count INTEGER;\r\n    max_favorites INTEGER;\r\nBEGIN\r\n    SELECT * INTO user_profile FROM profiles WHERE id = user_uuid;\r\n    \r\n    IF NOT FOUND THEN\r\n        RETURN FALSE;\r\n    END IF;\r\n    \r\n    SELECT COUNT(*) INTO current_favorites_count \r\n    FROM generations \r\n    WHERE user_id = user_uuid AND is_favorited = true;\r\n    \r\n    IF user_profile.status = 'active' OR is_user_in_trial_period(user_uuid) THEN\r\n        max_favorites := 300;\r\n    ELSE\r\n        max_favorites := 3;\r\n    END IF;\r\n    \r\n    RETURN current_favorites_count < max_favorites;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "check_user_style_group_limit",
    "argument_types": "",
    "return_type": "trigger",
    "language": "plpgsql",
    "function_definition": "CREATE OR REPLACE FUNCTION public.check_user_style_group_limit()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nBEGIN\r\n  IF (SELECT COUNT(*) FROM public.personal_style_groups WHERE user_id = NEW.user_id) >= 5 THEN\r\n    RAISE EXCEPTION 'Maximum limit of 5 personal style groups per user reached.';\r\n  END IF;\r\n  RETURN NEW;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "check_user_usage_limit_with_trial",
    "argument_types": "user_uuid uuid, operation_type text",
    "return_type": "boolean",
    "language": "plpgsql",
    "function_definition": "CREATE OR REPLACE FUNCTION public.check_user_usage_limit_with_trial(user_uuid uuid, operation_type text)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nDECLARE\r\n    user_profile profiles%ROWTYPE;\r\n    max_limit INT;\r\n    current_count INT;\r\n    is_in_trial BOOLEAN;\r\nBEGIN\r\n    -- 获取用户信息\r\n    SELECT * INTO user_profile FROM profiles WHERE id = user_uuid;\r\n\r\n    IF NOT FOUND THEN\r\n        RETURN FALSE;\r\n    END IF;\r\n\r\n    -- 检查是否在试用期内\r\n    is_in_trial := is_user_in_trial_period(user_uuid);\r\n\r\n    -- 根据用户类型和操作类型确定限制 (付费用户或试用期用户享有付费用户权益)\r\n    IF user_profile.status = 'active' OR is_in_trial THEN\r\n        IF operation_type = 'generation' THEN\r\n            max_limit := 30;\r\n            current_count := user_profile.generation_count;\r\n        ELSIF operation_type = 'rewrite' THEN\r\n            max_limit := 30;\r\n            current_count := user_profile.rewrite_count;\r\n        ELSE\r\n            RETURN FALSE; -- 未知的操作类型\r\n        END IF;\r\n    ELSE\r\n        -- 免费用户\r\n        IF operation_type = 'generation' THEN\r\n            max_limit := 1;\r\n            current_count := user_profile.generation_count;\r\n        ELSIF operation_type = 'rewrite' THEN\r\n            max_limit := 1;\r\n            current_count := user_profile.rewrite_count;\r\n        ELSE\r\n            RETURN FALSE; -- 未知的操作类型\r\n        END IF;\r\n    END IF;\r\n\r\n    RETURN current_count < max_limit;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_table_schema",
    "argument_types": "target_table text",
    "return_type": "TABLE(column_name text, data_type text, is_nullable text, column_default text, column_comment text)",
    "language": "plpgsql",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_table_schema(target_table text)\n RETURNS TABLE(column_name text, data_type text, is_nullable text, column_default text, column_comment text)\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    RETURN QUERY\r\n    SELECT \r\n        col.column_name::TEXT,\r\n        col.data_type::TEXT,\r\n        col.is_nullable::TEXT,\r\n        col.column_default::TEXT,\r\n        (SELECT obj_description(att.attrelid, 'pg_attribute') FROM pg_attribute att WHERE att.attrelid = col.table_name::regclass AND att.attname = col.column_name) AS comment\r\n    FROM information_schema.columns col\r\n    WHERE col.table_schema = 'public' \r\n      AND col.table_name = target_table\r\n    ORDER BY col.ordinal_position;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "handle_new_user",
    "argument_types": "",
    "return_type": "trigger",
    "language": "plpgsql",
    "function_definition": "CREATE OR REPLACE FUNCTION public.handle_new_user()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nBEGIN\r\n  INSERT INTO public.profiles (id, email, status, generation_count, rewrite_count, usage_last_reset, favorite_count, is_admin, is_trial_used)\r\n  VALUES (\r\n    NEW.id,\r\n    NEW.email,\r\n    'free',\r\n    0,\r\n    0,\r\n    CURRENT_DATE,\r\n    0,\r\n    FALSE,\r\n    FALSE  -- 新用户默认未使用试用期\r\n  );\r\n  RETURN NEW;\r\nEXCEPTION\r\n  WHEN unique_violation THEN\r\n    -- 如果profile已存在，忽略错误\r\n    RETURN NEW;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "increment_user_generation_count",
    "argument_types": "user_uuid uuid",
    "return_type": "void",
    "language": "plpgsql",
    "function_definition": "CREATE OR REPLACE FUNCTION public.increment_user_generation_count(user_uuid uuid)\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n  UPDATE profiles\r\n  SET generation_count = generation_count + 1\r\n  WHERE id = user_uuid;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "increment_user_rewrite_count",
    "argument_types": "user_uuid uuid",
    "return_type": "void",
    "language": "plpgsql",
    "function_definition": "CREATE OR REPLACE FUNCTION public.increment_user_rewrite_count(user_uuid uuid)\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n  UPDATE profiles\r\n  SET\r\n    rewrite_count = rewrite_count + 1,\r\n    updated_at = now()\r\n  WHERE id = user_uuid;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "is_user_in_trial_period",
    "argument_types": "user_uuid uuid",
    "return_type": "boolean",
    "language": "plpgsql",
    "function_definition": "CREATE OR REPLACE FUNCTION public.is_user_in_trial_period(user_uuid uuid)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nDECLARE\r\n    user_profile profiles%ROWTYPE;\r\nBEGIN\r\n    -- 获取用户信息\r\n    SELECT * INTO user_profile FROM profiles WHERE id = user_uuid;\r\n    \r\n    IF NOT FOUND THEN\r\n        RETURN FALSE;\r\n    END IF;\r\n    \r\n    -- 检查是否在试用期内\r\n    IF user_profile.trial_start_date IS NOT NULL \r\n       AND user_profile.trial_end_date IS NOT NULL \r\n       AND NOW() >= user_profile.trial_start_date \r\n       AND NOW() <= user_profile.trial_end_date THEN\r\n        RETURN TRUE;\r\n    END IF;\r\n    \r\n    RETURN FALSE;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "reset_daily_usage_counts",
    "argument_types": "",
    "return_type": "void",
    "language": "plpgsql",
    "function_definition": "CREATE OR REPLACE FUNCTION public.reset_daily_usage_counts()\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nBEGIN\r\n  UPDATE public.profiles\r\n  SET\r\n    generation_count = 0,\r\n    rewrite_count = 0,\r\n    updated_at = now()\r\n  WHERE\r\n    generation_count > 0 OR rewrite_count > 0;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "update_categories_updated_at",
    "argument_types": "",
    "return_type": "trigger",
    "language": "plpgsql",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_categories_updated_at()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    NEW.updated_at = NOW();\r\n    RETURN NEW;\r\nEND;\r\n$function$\n"
  }
]




查看所有行级安全策略：

[
  {
    "table_name": "api_usage_logs",
    "policy_name": "Admins can view all logs",
    "command": "SELECT",
    "using_clause": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))",
    "check_clause": null
  },
  {
    "table_name": "api_usage_logs",
    "policy_name": "Anonymous can insert logs",
    "command": "INSERT",
    "using_clause": null,
    "check_clause": "(user_id IS NULL)"
  },
  {
    "table_name": "api_usage_logs",
    "policy_name": "Anonymous logs",
    "command": "SELECT",
    "using_clause": "(user_id IS NULL)",
    "check_clause": null
  },
  {
    "table_name": "api_usage_logs",
    "policy_name": "Users can insert own logs",
    "command": "INSERT",
    "using_clause": null,
    "check_clause": "(auth.uid() = user_id)"
  },
  {
    "table_name": "api_usage_logs",
    "policy_name": "Users can view own logs",
    "command": "SELECT",
    "using_clause": "(auth.uid() = user_id)",
    "check_clause": null
  },
  {
    "table_name": "categories",
    "policy_name": "Admins can manage categories",
    "command": "ALL",
    "using_clause": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))",
    "check_clause": null
  },
  {
    "table_name": "categories",
    "policy_name": "Anyone can view categories",
    "command": "SELECT",
    "using_clause": "(is_active = true)",
    "check_clause": null
  },
  {
    "table_name": "generations",
    "policy_name": "Admins can view all generations",
    "command": "SELECT",
    "using_clause": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))",
    "check_clause": null
  },
  {
    "table_name": "generations",
    "policy_name": "Users can delete own generations",
    "command": "DELETE",
    "using_clause": "(auth.uid() = user_id)",
    "check_clause": null
  },
  {
    "table_name": "generations",
    "policy_name": "Users can insert own generations",
    "command": "INSERT",
    "using_clause": null,
    "check_clause": "(auth.uid() = user_id)"
  },
  {
    "table_name": "generations",
    "policy_name": "Users can update own generations",
    "command": "UPDATE",
    "using_clause": "(auth.uid() = user_id)",
    "check_clause": null
  },
  {
    "table_name": "generations",
    "policy_name": "Users can view own generations",
    "command": "SELECT",
    "using_clause": "(auth.uid() = user_id)",
    "check_clause": null
  },
  {
    "table_name": "personal_style_groups",
    "policy_name": "Users can manage their own style groups",
    "command": "ALL",
    "using_clause": "(auth.uid() = user_id)",
    "check_clause": "(auth.uid() = user_id)"
  },
  {
    "table_name": "personal_style_lyrics",
    "policy_name": "Users can delete own personal styles",
    "command": "DELETE",
    "using_clause": "(auth.uid() = user_id)",
    "check_clause": null
  },
  {
    "table_name": "personal_style_lyrics",
    "policy_name": "Users can insert own personal styles",
    "command": "INSERT",
    "using_clause": null,
    "check_clause": "(auth.uid() = user_id)"
  },
  {
    "table_name": "personal_style_lyrics",
    "policy_name": "Users can update own personal styles",
    "command": "UPDATE",
    "using_clause": "(auth.uid() = user_id)",
    "check_clause": null
  },
  {
    "table_name": "personal_style_lyrics",
    "policy_name": "Users can view own personal styles",
    "command": "SELECT",
    "using_clause": "(auth.uid() = user_id)",
    "check_clause": null
  },
  {
    "table_name": "posts",
    "policy_name": "Admins can manage posts",
    "command": "ALL",
    "using_clause": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))",
    "check_clause": null
  },
  {
    "table_name": "posts",
    "policy_name": "Anyone can view published posts",
    "command": "SELECT",
    "using_clause": "(status = 'published'::post_status)",
    "check_clause": null
  },
  {
    "table_name": "profiles",
    "policy_name": "Users can update own profile",
    "command": "UPDATE",
    "using_clause": "(auth.uid() = id)",
    "check_clause": null
  },
  {
    "table_name": "profiles",
    "policy_name": "Users can view own profile",
    "command": "SELECT",
    "using_clause": "(auth.uid() = id)",
    "check_clause": null
  },
  {
    "table_name": "user_sessions",
    "policy_name": "Anonymous can insert sessions",
    "command": "INSERT",
    "using_clause": null,
    "check_clause": "(user_id IS NULL)"
  },
  {
    "table_name": "user_sessions",
    "policy_name": "Anonymous sessions",
    "command": "SELECT",
    "using_clause": "(user_id IS NULL)",
    "check_clause": null
  },
  {
    "table_name": "user_sessions",
    "policy_name": "Users can insert own sessions",
    "command": "INSERT",
    "using_clause": null,
    "check_clause": "(auth.uid() = user_id)"
  },
  {
    "table_name": "user_sessions",
    "policy_name": "Users can update own sessions",
    "command": "UPDATE",
    "using_clause": "(auth.uid() = user_id)",
    "check_clause": null
  },
  {
    "table_name": "user_sessions",
    "policy_name": "Users can view own sessions",
    "command": "SELECT",
    "using_clause": "(auth.uid() = user_id)",
    "check_clause": null
  }
]



查看所有定时任务：

[
  {
    "job_id": 16,
    "job_name": "daily-usage-reset",
    "cron_schedule": "0 0 * * *",
    "database": "postgres",
    "username": "postgres",
    "job_command": "SELECT public.reset_daily_usage_counts()",
    "active": true
  },
  {
    "job_id": 14,
    "job_name": "handle-expired-trials",
    "cron_schedule": "0 2 * * *",
    "database": "postgres",
    "username": "postgres",
    "job_command": "SELECT handle_expired_trials();",
    "active": true
  },
  {
    "job_id": 15,
    "job_name": "process-paddle-webhooks",
    "cron_schedule": "0 * * * *",
    "database": "postgres",
    "username": "postgres",
    "job_command": "select process_paddle_webhooks(100);",
    "active": true
  }
]





查看函数权限：
[
  {
    "function_name": "activate_user_trial",
    "granted_to_role": "authenticated",
    "privilege_type": "EXECUTE",
    "is_grantable": "NO"
  },
  {
    "function_name": "activate_user_trial",
    "granted_to_role": "postgres",
    "privilege_type": "EXECUTE",
    "is_grantable": "YES"
  },
  {
    "function_name": "activate_user_trial",
    "granted_to_role": "service_role",
    "privilege_type": "EXECUTE",
    "is_grantable": "NO"
  },
  {
    "function_name": "can_user_use_trial",
    "granted_to_role": "authenticated",
    "privilege_type": "EXECUTE",
    "is_grantable": "NO"
  },
  {
    "function_name": "can_user_use_trial",
    "granted_to_role": "postgres",
    "privilege_type": "EXECUTE",
    "is_grantable": "YES"
  },
  {
    "function_name": "can_user_use_trial",
    "granted_to_role": "service_role",
    "privilege_type": "EXECUTE",
    "is_grantable": "NO"
  },
  {
    "function_name": "check_user_usage_limit_with_trial",
    "granted_to_role": "authenticated",
    "privilege_type": "EXECUTE",
    "is_grantable": "NO"
  },
  {
    "function_name": "check_user_usage_limit_with_trial",
    "granted_to_role": "postgres",
    "privilege_type": "EXECUTE",
    "is_grantable": "YES"
  },
  {
    "function_name": "check_user_usage_limit_with_trial",
    "granted_to_role": "service_role",
    "privilege_type": "EXECUTE",
    "is_grantable": "NO"
  },
  {
    "function_name": "is_user_in_trial_period",
    "granted_to_role": "authenticated",
    "privilege_type": "EXECUTE",
    "is_grantable": "NO"
  },
  {
    "function_name": "is_user_in_trial_period",
    "granted_to_role": "postgres",
    "privilege_type": "EXECUTE",
    "is_grantable": "YES"
  },
  {
    "function_name": "is_user_in_trial_period",
    "granted_to_role": "service_role",
    "privilege_type": "EXECUTE",
    "is_grantable": "NO"
  },
  {
    "function_name": "reset_daily_usage_counts",
    "granted_to_role": "authenticated",
    "privilege_type": "EXECUTE",
    "is_grantable": "NO"
  },
  {
    "function_name": "reset_daily_usage_counts",
    "granted_to_role": "postgres",
    "privilege_type": "EXECUTE",
    "is_grantable": "YES"
  },
  {
    "function_name": "reset_daily_usage_counts",
    "granted_to_role": "service_role",
    "privilege_type": "EXECUTE",
    "is_grantable": "NO"
  }
]
