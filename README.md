# AI Lyrics Generator

涓€涓熀浜嶢I鐨勪笓涓氭瓕璇嶇敓鎴愬伐鍏凤紝鏀寔澶氱璇█鍜岄鏍硷紝闆嗘垚浜哖addle鏀粯绯荤粺銆?
## 鍔熻兘鐗规€?
- 馃 **AI姝岃瘝鐢熸垚**: 浣跨敤鍏堣繘鐨凙I鎶€鏈敓鎴愪笓涓氱骇姝岃瘝
- 馃實 **澶氳瑷€鏀寔**: 鏀寔100+璇█鐨勬瓕璇嶇敓鎴?- 馃幍 **澶氱椋庢牸**: 鏀寔娴佽銆佽鍞便€佹皯璋ｇ瓑澶氱闊充箰椋庢牸
- 馃挸 **璁㈤槄绯荤粺**: 闆嗘垚Paddle鏀粯锛屾敮鎸佹湀浠樺拰骞翠粯璁㈤槄
- 馃敀 **瀹夊叏璁よ瘉**: 瀹屾暣鐨勭敤鎴疯璇佸拰鎺堟潈绯荤粺
- 馃摫 **鍝嶅簲寮忚璁?*: 鏀寔妗岄潰鍜岀Щ鍔ㄨ澶?- 馃殌 **楂樻€ц兘**: 鍩轰簬Next.js 14鏋勫缓锛屾敮鎸丼SR鍜岄潤鎬佺敓鎴?
## 鎶€鏈爤

- **鍓嶇**: Next.js 14, React 18, TypeScript
- **鏍峰紡**: Tailwind CSS
- **鏁版嵁搴?*: Supabase (PostgreSQL)
- **璁よ瘉**: Supabase Auth
- **鏀粯**: Paddle
- **閮ㄧ讲**: Vercel

## 蹇€熷紑濮?
### 鐜瑕佹眰

- Node.js 18+
- npm 鎴?yarn
- Supabase 璐︽埛
- Paddle 璐︽埛

### 瀹夎渚濊禆

```bash
npm install
# 鎴?yarn install
```

### 鐜鍙橀噺閰嶇疆

鍒涘缓 `.env.local` 鏂囦欢骞堕厤缃互涓嬪彉閲忥細

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google AI API
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Paddle Payment Configuration
NEXT_PUBLIC_PADDLE_CLIENT_ID=your-paddle-client-id
PADDLE_API_KEY=your-paddle-api-key
PADDLE_WEBHOOK_SECRET=your-paddle-webhook-secret
NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID=your-monthly-price-id
NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID=your-yearly-price-id
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_API_BASE_URL=https://sandbox-api.paddle.com

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 鏁版嵁搴撹缃?
1. 鍦⊿upabase涓垱寤烘柊椤圭洰
2. 杩愯鏁版嵁搴撹縼绉昏剼鏈紙鍙傝€?`鏁版嵁搴撴洿鏂?md`锛?3. 閰嶇疆RLS绛栫暐鍜屾潈闄?
### 鍚姩寮€鍙戞湇鍔″櫒

```bash
npm run dev
# 鎴?yarn dev
```

璁块棶 [http://localhost:3000](http://localhost:3000) 鏌ョ湅搴旂敤銆?
## Paddle鏀粯闆嗘垚

### 鍔熻兘鐗规€?
- 鉁?**Overlay Checkout**: 浣跨敤Paddle.js鐨刼verlay妯″紡
- 鉁?**鐜鍒囨崲**: 鏀寔娴嬭瘯鍜屾寮忕幆澧?- 鉁?**Webhook澶勭悊**: 瀹屾暣鐨剋ebhook浜嬩欢澶勭悊
- 鉁?**璁㈤槄绠＄悊**: 鏀寔璁㈤槄鐨勫垱寤恒€佹殏鍋溿€佹仮澶嶅拰鍙栨秷
- 鉁?**瀹夊叏楠岃瘉**: HMAC绛惧悕楠岃瘉纭繚webhook瀹夊叏

### 鐜閰嶇疆

閫氳繃淇敼鐜鍙橀噺 `NEXT_PUBLIC_PADDLE_ENVIRONMENT` 鏉ュ垏鎹㈢幆澧冿細

- `sandbox`: 娴嬭瘯鐜
- `production`: 姝ｅ紡鐜

### Webhook閰嶇疆

鍦≒addle Dashboard涓厤缃畐ebhook endpoint锛?
```
https://your-domain.com/api/webhook/paddle
```

鏀寔鐨剋ebhook浜嬩欢锛?- `subscription.created`
- `subscription.updated`
- `subscription.cancelled`
- `subscription.paused`
- `subscription.resumed`
- `transaction.completed`
- `transaction.billing_failed`

## 椤圭洰缁撴瀯

```
鈹溾攢鈹€ app/                    # Next.js 13+ App Router
鈹?  鈹溾攢鈹€ api/               # API璺敱
鈹?  鈹?  鈹溾攢鈹€ webhook/       # Webhook澶勭悊
鈹?  鈹?  鈹斺攢鈹€ subscription/   # 璁㈤槄绠＄悊
鈹?  鈹溾攢鈹€ auth/              # 璁よ瘉椤甸潰
鈹?  鈹溾攢鈹€ dashboard/         # 鐢ㄦ埛浠〃鏉?鈹?  鈹溾攢鈹€ generate/          # 姝岃瘝鐢熸垚椤甸潰
鈹?  鈹斺攢鈹€ pricing/           # 瀹氫环椤甸潰
鈹溾攢鈹€ components/            # React缁勪欢
鈹?  鈹溾攢鈹€ layout/           # 甯冨眬缁勪欢
鈹?  鈹溾攢鈹€ pricing/          # 瀹氫环缁勪欢
鈹?  鈹斺攢鈹€ ui/               # UI缁勪欢
鈹溾攢鈹€ lib/                  # 宸ュ叿搴?鈹?  鈹溾攢鈹€ hooks/            # 鑷畾涔塇ooks
鈹?  鈹溾攢鈹€ paddle.ts         # Paddle閰嶇疆
鈹?  鈹斺攢鈹€ supabase.ts       # Supabase瀹㈡埛绔?鈹斺攢鈹€ public/               # 闈欐€佽祫婧?```

## 閮ㄧ讲

### Vercel閮ㄧ讲

1. 杩炴帴GitHub浠撳簱鍒癡ercel
2. 閰嶇疆鐜鍙橀噺
3. 閮ㄧ讲

### 鐜鍙橀噺閰嶇疆

纭繚鍦ㄧ敓浜х幆澧冧腑閰嶇疆鎵€鏈夊繀瑕佺殑鐜鍙橀噺锛岀壒鍒槸锛?
- Paddle姝ｅ紡鐜鐨勯厤缃?- 姝ｇ‘鐨剋ebhook URL
- 鐢熶骇鐜鐨凷upabase閰嶇疆

## 寮€鍙戞寚鍗?
### 娣诲姞鏂扮殑鏀粯璁″垝

1. 鍦≒addle Dashboard涓垱寤烘柊鐨勪环鏍?2. 鏇存柊鐜鍙橀噺涓殑浠锋牸ID
3. 鍦ㄥ畾浠烽〉闈腑娣诲姞鏂扮殑璁″垝

### 鑷畾涔墂ebhook澶勭悊

鍦?`app/api/webhook/paddle/route.ts` 涓坊鍔犳柊鐨勪簨浠跺鐞嗛€昏緫銆?
### 鏍峰紡瀹氬埗

浣跨敤Tailwind CSS杩涜鏍峰紡瀹氬埗锛屼富瑕侀鑹插彉閲忓湪 `tailwind.config.ts` 涓畾涔夈€?
## 璐＄尞

娆㈣繋鎻愪氦Issue鍜孭ull Request锛?
## 璁稿彲璇?
MIT License

## 鏀寔

濡傛湁闂锛岃閫氳繃浠ヤ笅鏂瑰紡鑱旂郴锛?
- 鎻愪氦GitHub Issue
- 鍙戦€侀偖浠跺埌 support@your-domain.com

## 鏇存柊鏃ュ織

### v2.0.0
- 闆嗘垚Paddle鏀粯绯荤粺
- 娣诲姞璁㈤槄绠＄悊鍔熻兘
- 閲嶆瀯瀹氫环椤甸潰
- 浼樺寲鐢ㄦ埛鐣岄潰

### v1.0.0
- 鍒濆鐗堟湰鍙戝竷
- 鍩虹AI姝岃瘝鐢熸垚鍔熻兘
- 鐢ㄦ埛璁よ瘉绯荤粺
