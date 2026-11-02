# مسار إكس | Masar X — Front-End

> منصة شحن سعودية موحدة — واجهة أمامية احترافية بـ Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui.

[![Status](https://img.shields.io/badge/Status-MVP%20%2F%20Integration%20Pending-yellow)]()
[![RTL](https://img.shields.io/badge/RTL-100%25-brightgreen)]()
[![Responsive](https://img.shields.io/badge/Responsive-Mobile%20First-blue)]()
[![API](https://img.shields.io/badge/API-Proxy%20%2B%20Service%20Layer-orange)]()

تم بناء هذا المشروع بالاعتماد الكامل على:
- **OpenAPI 3.1 spec** من الباك إند (`https://YOUR_BACKEND_DOMAIN/api/v1/openapi.json`)
- **الهوية البصرية المرفقة** (شعار M الأخضر + خلفية كريمية + شعار "شحنك أدق، وأعمالك أسرع")

---

## 🚀 التشغيل السريع

### المتطلبات
- [Bun](https://bun.sh) (موصى به) أو Node.js 18+
- npm أو bun

### التشغيل المحلي بالبيانات التجريبية

```bash
# 1. فك ضغط المشروع ثم ادخل مجلده
cd masar-x-frontend

# 2. انسخ قالب البيئة (PowerShell: Copy-Item .env.example .env)
cp .env.example .env

# 3. تثبيت الاعتمادات والتشغيل
npm install
npm run dev

# 4. افتح http://localhost:3000
#    رمز OTP التجريبي: 1234
```

الوضع الافتراضي في `.env.example` هو `demo`، وتُقرأ البيانات التجريبية من
`src/lib/api/mock/data.ts` دون اتصال بالخادم الحقيقي.

### التوصيل بالباك إند الحقيقي

بعد تجهيز خادم API وشهادات TLS:

```env
NEXT_PUBLIC_API_MODE=real
BACKEND_URL=https://YOUR_BACKEND_DOMAIN
```

يجب أن يشير `BACKEND_URL` إلى خادم HTTPS صالح وأن تكون مسارات OpenAPI ومخططات الطلبات متوافقة. مصادقة المشروع الحالية OTP فقط؛ تسجيل الدخول بكلمة المرور يتطلب إضافة endpoint من الباك إند. لا تضع مفاتيح الناقلين أو الدفع في متغيرات `NEXT_PUBLIC_*`.

---

## 🔧 ملفات البيئة

يحتوي التسليم على `.env.example` فقط. تُنشأ نسخة `.env` محلياً ولا تُرفع إلى Git أو تُشارك؛ لأن ملفات البيئة قد تحتوي عناوين داخلية أو أسرار تشغيل.

### المتغيرات الرئيسية

```bash
# وضع الـ API: "real" أو "demo"
NEXT_PUBLIC_API_MODE=demo

# عنوان الباك إند (server-side only — لا يُكشف للمتصفح)
BACKEND_URL=https://YOUR_BACKEND_DOMAIN
```

### التبديل بين الوضعين

```bash
# للوضع الحقيقي: عدّل قيم .env إلى real ورابط HTTPS الخاص بخادمك
npm run dev

# للوضع التجريبي:
# NEXT_PUBLIC_API_MODE=demo في .env ثم أعد تشغيل الخادم
```

> ⚡ لا حاجة لإعادة تثبيت الاعتمادات عند التبديل — يكفي تعديل `.env` وإعادة تشغيل الخادم.

---

## 📊 نظرة عامة

### الإحصائيات
- **17 شاشة/صفحة**: 15 مسارًا داخل التطبيق + تسجيل الدخول والتسجيل
- مسارات API وخدمات للوظائف الأساسية؛ وجود المسار في الكود لا يعني أن الخدمة الخارجية اختُبرت أو فُعّلت في بيئة الإنتاج.
- **وضعان للتشغيل**: حقيقي + تجريبي
- **100% RTL** + خط Cairo العربي
- **Mobile-first** مع responsive كامل

### الصفحات

| # | الصفحة | الوصف |
|---|--------|------|
| 1 | Login | تسجيل الدخول بكلمة المرور أو OTP عند عدم توفر المسار الجديد |
| 2 | Register | إنشاء حساب + OTP |
| 3 | Dashboard | لوحة تحكم مع إحصائيات + Quick Actions |
| 4 | Shipments | قائمة الشحنات + بحث + فلترة |
| 5 | Shipment Details | تفاصيل شحنة + سجل زمني + إجراءات |
| 6 | Create Shipment | إنشاء شحنة + تسعير فوري + حقول ناقل ديناميكية |
| 7 | Wallet | محفظة + معاملات + شحن المحفظة |
| 8 | Address Book | إدارة المرسلين والمستلمين |
| 9 | Address Lookup | البحث بالعنوان المختصر / رمز جهة الاتصال |
| 10 | Weight Disputes | اعتراضات الوزن والأبعاد ورفع الأدلة |
| 11 | Carrier Capabilities | قدرات الناقل والحقول الإضافية الديناميكية |
| 12 | Integrations | حالة التكاملات وسجل Webhooks (للمسؤول فقط) |
| 13 | Customers | إدارة جهات الاتصال |
| 14 | Invoices | الفواتير + PDF |
| 15 | Tracking | تتبّع الشحنة |
| 16 | Notifications | الإشعارات + تعليم كمقروء |
| 17 | Profile | الملف الشخصي + بيانات المتجر + تغيير كلمة المرور |
---

## 🎨 الهوية البصرية

### الألوان
```css
--brand:       #0E3B2E;  /* الأخضر الأساسي */
--brand-deep:  #082A20;  /* تدرّج أعمق */
--brand-soft:  #1F7A4E;  /* لون مميز */
--cream:       #F7F3EA;  /* خلفية دافئة */
--cream-deep:  #EFE8D6;  /* تدرّج خلفية */
```

### الخطوط
- **Cairo** (Google Fonts) — الخط العربي الأساسي (300-900 weight)
- **Geist Mono** — للأرقام والأكواد

---

## 🏗️ البنية التقنية

### تدفّق البيانات
```
المتصفح
  ↓ fetch (relative URL)
Next.js Server (/api/proxy/*)
  ↓ server-to-server (BACKEND_URL)
Masar X Backend (YOUR_BACKEND_DOMAIN)
```

### الـ API Proxy
- Route handler على `/api/proxy/[...path]` يعيد توجيه كل الطلبات للباك إند
- يتجنّب مشاكل CORS
- يُبقي عنوان الباك إند سرياً (server-side only)
- يحافظ على Bearer token + query params + body

### نظام Mock Data
- طبقة `mockApi` في `src/lib/api/mock/client.ts` تحاكي نفس واجهة `apiClient`
- التبديل عبر `NEXT_PUBLIC_API_MODE=demo` في `.env`
- بيانات وهمية شاملة: مستخدم، 6 شحنات، 5 عملاء، 4 فواتير، 6 معاملات، 5 إشعارات، محفظة برصيد 2,540 ر.س
- OTP تجريبي: `1234`

---

## 📁 هيكل المشروع

```
masar-x-frontend/
├── .env.example                  # قالب بيئة آمن (أنشئ .env محلياً)
├── README.md                      # هذا الملف
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx             # RTL + Cairo font + Metadata
│   │   ├── page.tsx               # نقطة الدخول
│   │   ├── globals.css            # نظام الألوان + utilities
│   │   └── api/proxy/[...path]/route.ts  # API proxy
│   ├── components/
│   │   ├── brand/                 # Logo + BrandPanel
│   │   ├── auth/                  # Login + Register + PhoneInput + ...
│   │   ├── layout/                # DashboardLayout + Sidebar + Topbar
│   │   ├── dashboard/             # HeroBanner + Stats + QuickActions + Recent*
│   │   ├── pages/                 # 15 مكوّن صفحة فعلية (تشمل 4 وحدات جديدة)
│   │   ├── common/                # StateViews + StatusBadge + PageHeader
│   │   └── ui/                    # shadcn/ui components
│   ├── hooks/                     # useAuth + useShipments + useWallet + useData
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts          # fetch wrapper + Bearer token
│   │   │   ├── endpoints.ts       # كل مسارات OpenAPI الـ83
│   │   │   ├── services.ts       # دوال لكل وحدة + isDemoMode()
│   │   │   └── mock/
│   │   │       ├── client.ts      # mockApi يحاكي apiClient
│   │   │       └── data.ts       # كل البيانات الوهمية
│   │   ├── router/AppRouter.tsx  # راوتر state-based
│   │   ├── format.ts             # تنسيق عملة/تاريخ/جوال
│   │   └── utils.ts
│   ├── store/                    # Zustand + persist
│   │   ├── authStore.ts          # جلسة + مستخدم
│   │   └── routerStore.ts        # راوتر state-based
│   └── types/api.ts              # أنواع TypeScript مشتقة من OpenAPI
└── public/                       # static assets
```

---

## 🔐 تدفّق المصادقة (OTP)

الباك إند يعتمد مصادقة JWT عبر OTP:

1. **طلب رمز OTP**: `POST /api/v1/auth/otp/request` بـ `{phone, accountType}`
2. **تحقق OTP**: `POST /api/v1/auth/otp/verify` بـ `{phone, code, accountType}` → يُرجع `accessToken`
3. **بياناتي**: `GET /api/v1/auth/me` بـ Bearer token
4. **استكمال الملف**: `PATCH /api/v1/auth/me`

### الأمان
- Bearer token يُخزّن في `localStorage` عبر Zustand persist
- الـ proxy يضيف `Authorization: Bearer <token>` تلقائياً
- عند انتهاء صلاحية الـ token (401)، يُعاد توجيه المستخدم لتسجيل الدخول

---

## 📱 التجاوب (Responsive)

- **Mobile-first** عبر Tailwind breakpoints
- القائمة الجانبية → `Sheet` (drawer) على الموبايل
- الجداول → بطاقات على الشاشات الصغيرة
- كل العناصر التفاعلية ≥ 44px للّمس الآمن
- Sticky header + push footer
- Safe-area aware (iOS notch)

---

## ✅ الحالات المُعالَجة

- **Loading** — Skeleton / Spinner مع رسالة
- **Error** — بطاقة خطأ مع زر إعادة المحاولة
- **Empty** — حالة فارغة مع أيقونة وزر إجراء
- **Unauthorized** — إعادة توجيه لتسجيل الدخول
- **Form validation** — لكل حقل مع رسائل عربية
- **Toast notifications** — عبر Sonner

---

## 🧪 الاختبار

```bash
bun run lint    # فحص ESLint + قواعد Next.js
```

تم التحقق من:
- ✅ جميع الصفحات الـ12 (Desktop + Mobile)
- الوضع الحقيقي يتطلب خادم Backend متاحاً ومتوافقاً وإعداد `BACKEND_URL` عبر HTTPS.
- الوضع التجريبي يستخدم OTP بقيمة `1234` وبيانات وهمية محلية.
- لم يُتحقق من بناء الإنتاج في هذه المراجعة بسبب تعذر تثبيت الاعتمادات ضمن بيئة الفحص.

---

## 🛠️ التقنيات المستخدمة

| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| Next.js | 16.1.3 | الإطار الأساسي (App Router) |
| TypeScript | 5.x | اللغة (strict mode) |
| Tailwind CSS | 4.x | التنسيق |
| shadcn/ui | — | مكتبة المكوّنات |
| Zustand | 5.x | إدارة الحالة + persist |
| Cairo | Google Fonts | الخط العربي |
| Sonner | 2.x | الإشعارات |
| PagedJS | 0.4.3 | لتقارير PDF (اختياري) |

---

## 📦 النشر للإنتاج

```bash
# البناء
bun run build

# التشغيل
bun run start

# أو عبر Docker (اختياري)
# تأكد من ضبط BACKEND_URL على عنوان الإنتاج عبر HTTPS، ولا تستخدم HTTP في الإنتاج
```

---

## 🆘 استكشاف الأخطاء

### المشكلة: الطلبات تُرجع 401
**السبب**: انتهت صلاحية الـ token أو الجلسة غير صالحة.
**الحل**: سجّل خروج ثم دخول من جديد.

### المشكلة: لا تظهر بيانات
**السبب**: قد يكون الباك إند غير قابل للوصول.
**الحل**: جرّب الوضع التجريبي: `cp .env.example .env && npm run dev`

### المشكلة: خطأ CORS
**السبب**: لا يجب أن يحدث — كل الطلبات تمر عبر `/api/proxy/*`.
**الحل**: تأكد أنك لا تستدعي `BACKEND_URL` مباشرة من المتصفح.

---

## 📞 الدعم

للأسئلة أو الدعم التقني، يرجى مراجعة:
- **التقرير الفني للمطابقة والفجوات**: `ANALYSIS_REPORT_AR.md`
- **لقطات الشاشة**: مجلد `screenshots/`
- **هيكل الكود**: راجع التعليقات في كل ملف

---

© 2026 مسار إكس — منصة الشحن السعودية الموحدة

---

## وحدات إضافية وعقود Backend المطلوبة

أضيفت إلى الواجهة صفحات عملية لجلب العنوان المختصر، واعتراضات فروقات الوزن مع رفع الأدلة، واستعراض قدرات الناقل وحقوله الديناميكية، ومركز التكاملات وسجل Webhooks. كما أضيفت واجهات تسجيل الدخول بكلمة المرور، استعادة كلمة المرور، وتغييرها من الملف الشخصي.

**مسارات API المقترحة الجديدة:** 15 route-method combinations موزعة على المصادقة، lookup العناوين، قدرات الناقلين، اعتراضات الوزن، والتكاملات. هذه المسارات معرفة في طبقة خدمات الفرونت وليست إثباتًا على وجود تنفيذ Backend.

راجع الوثائق قبل ربط وضع `real`:
- `BACKEND_HANDOFF_AR.md` — مواصفات عربية مفصلة لمهندس Backend مع أمثلة الطلب والاستجابة والأمان والأولويات.
- `docs/backend-api-contract-additions.yaml` — مسودة OpenAPI 3.1 delta للمسارات الجديدة.
- `BACKEND_NOTES.md` — ملاحظات التكاملات والعقود القائمة التي تحتاج توسيعًا.

المرفقات تعيد استخدام `POST /uploads/presign` الموجود مسبقًا مع إضافة الغرض `WEIGHT_DISPUTE_EVIDENCE`، ولا تحتاج endpoint رفع جديدًا. كذلك لا تُنشأ مسارات منفصلة للمرسلين والمستلمين؛ يكفي توسيع `GET /customers` بفلاتر `type` و`cityId`.
