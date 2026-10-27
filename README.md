# مسار إكس | Masar X — Front-End

> منصة شحن سعودية موحدة — واجهة أمامية احترافية بـ Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui.

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)]()
[![RTL](https://img.shields.io/badge/RTL-100%25-brightgreen)]()
[![Responsive](https://img.shields.io/badge/Responsive-Mobile%20First-blue)]()
[![API](https://img.shields.io/badge/API-83%20Endpoints-orange)]()

تم بناء هذا المشروع بالاعتماد الكامل على:
- **OpenAPI 3.1 spec** من الباك إند (`http://185.211.5.19:8081/api/v1/openapi.json`)
- **الهوية البصرية المرفقة** (شعار M الأخضر + خلفية كريمية + شعار "شحنك أدق، وأعمالك أسرع")

---

## 🚀 التشغيل السريع

### المتطلبات
- [Bun](https://bun.sh) (موصى به) أو Node.js 18+
- npm أو bun

### الطريقة 1: عبر الباك إند الحقيقي (الوضع الافتراضي)

```bash
# 1. فك ضغط المشروع
unzip masar-x-frontend.zip
cd masar-x-frontend

# 2. تثبيت الاعتمادات
bun install        # أو: npm install

# 3. التشغيل (ملف .env مُعد مسبقاً للوضع الحقيقي)
bun run dev        # أو: npm run dev

# 4. افتح المتصفح على
#    http://localhost:3000
```

> عند الوضع الحقيقي، استخدم رقم جوال سعودي حقيقي + رمز OTP الذي يصلك عبر WhatsApp.

### الطريقة 2: بالبيانات الوهمية (Demo Mode)

```bash
# 1. نسخ ملف البيئة التجريبي
cp .env.demo .env

# 2. التشغيل
bun run dev

# 3. افتح http://localhost:3000
#    • أدخل أي رقم جوال سعودي (مثال: 519999999)
#    • اضغط "إرسال رمز التحقق"
#    • استخدم الرمز: 1234
```

> في الوضع التجريبي، تظهر شارة "وضع تجريبي" أعلى كل صفحة. كل البيانات تأتي من
> `src/lib/api/mock/data.ts` محلياً دون أي اتصال بالباك إند.

---

## 🔧 ملفات البيئة

يحتوي المشروع على 3 ملفات بيئة:

| الملف | الوضع | الاستخدام |
|-------|------|-----------|
| `.env` | real (افتراضي) | التشغيل عبر الباك إند الحقيقي |
| `.env.real` | real | قالب للنسخ عند العودة للوضع الحقيقي |
| `.env.demo` | demo | قالب للنسخ عند التبديل للوضع التجريبي |
| `.env.example` | — | شرح المتغيرات |

### المتغيرات الرئيسية

```bash
# وضع الـ API: "real" (افتراضي) أو "demo"
NEXT_PUBLIC_API_MODE=real

# عنوان الباك إند (server-side only — لا يُكشف للمتصفح)
BACKEND_URL=http://185.211.5.19:8081

# قاعدة البيانات المحلية (Prisma + SQLite — غير مستخدمة في الـ frontend)
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

### التبديل بين الوضعين

```bash
# للوضع الحقيقي:
cp .env.real .env && bun run dev

# للوضع التجريبي:
cp .env.demo .env && bun run dev
```

> ⚡ لا حاجة لإعادة تثبيت الاعتمادات عند التبديل — يكفي تعديل `.env` وإعادة تشغيل الخادم.

---

## 📊 نظرة عامة

### الإحصائيات
- **12 صفحة** مستقلة (لكل صفحة مكوّن منفصل)
- **83 نقطة نهاية API** موزعة على 12 وحدة (Auth, Shipments, Wallet, ...)
- **وضعان للتشغيل**: حقيقي + تجريبي
- **100% RTL** + خط Cairo العربي
- **Mobile-first** مع responsive كامل

### الصفحات

| # | الصفحة | الوصف |
|---|--------|------|
| 1 | Login | تسجيل دخول OTP + تبديل تاجر/عميل |
| 2 | Register | إنشاء حساب + OTP + خيار Google |
| 3 | Dashboard | لوحة تحكم مع إحصائيات + Quick Actions |
| 4 | Shipments | قائمة الشحنات + بحث + فلترة |
| 5 | Shipment Details | تفاصيل شحنة + سجل زمني + إجراءات |
| 6 | Create Shipment | نموذج إنشاء شحنة + تسعير فوري |
| 7 | Wallet | محفظة + معاملات + شحن المحفظة |
| 8 | Customers | دفتر عملاء + إضافة/حذف |
| 9 | Invoices | فواتير ZATCA + PDF |
| 10 | Tracking | تتبّع شحنة (بدون مصادقة) |
| 11 | Notifications | إشعارات + تعليم كمقروء |
| 12 | Profile | ملف شخصي + بيانات المتجر |

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
Masar X Backend (185.211.5.19:8081)
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
├── .env, .env.real, .env.demo    # ملفات البيئة
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
│   │   ├── pages/                 # 12 صفحة مستقلة
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
- ✅ الوضع الحقيقي (cities, carriers, OTP)
- ✅ الوضع التجريبي (login بـ 1234، إنشاء شحنة، شحن محفظة)
- ✅ ESLint نظيف (0 errors)
- ✅ React Compiler compatible

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
# تأكد من ضبط BACKEND_URL على عنوان الإنتاج
```

---

## 🆘 استكشاف الأخطاء

### المشكلة: الطلبات تُرجع 401
**السبب**: انتهت صلاحية الـ token أو الجلسة غير صالحة.
**الحل**: سجّل خروج ثم دخول من جديد.

### المشكلة: لا تظهر بيانات
**السبب**: قد يكون الباك إند غير قابل للوصول.
**الحل**: جرّب الوضع التجريبي: `cp .env.demo .env && bun run dev`

### المشكلة: خطأ CORS
**السبب**: لا يجب أن يحدث — كل الطلبات تمر عبر `/api/proxy/*`.
**الحل**: تأكد أنك لا تستدعي `BACKEND_URL` مباشرة من المتصفح.

---

## 📞 الدعم

للأسئلة أو الدعم التقني، يرجى مراجعة:
- **التقرير الفني الكامل**: `MasarX-Frontend-Report.pdf`
- **لقطات الشاشة**: مجلد `screenshots/`
- **هيكل الكود**: راجع التعليقات في كل ملف

---

© 2026 مسار إكس — منصة الشحن السعودية الموحدة
