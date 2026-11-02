# ملاحظات الباك إند — Endpoints الناقصة المُكتشفة

> **الهدف:** توثيق كل ما يحتاجه الباك إند إضافته لدعم كامل لواجهة مسار إكس  
> **التاريخ:** 2026-10  
> **الحالة:** مُكتشفة أثناء تطوير الواجهة الأمامية

---

> **التوثيق الموسع:** راجع [`BACKEND_HANDOFF_AR.md`](./BACKEND_HANDOFF_AR.md) للعقود الجديدة المقترحة وعددها 15 طريقة/مسار، مع أمثلة request/response والأمان والأولويات، و[`docs/backend-api-contract-additions.yaml`](./docs/backend-api-contract-additions.yaml) لمسودة OpenAPI 3.1. هذه المسارات لم يتم تأكيد تنفيذها في Backend.

## 🔴 ملاحظات حرجة (Critical)

### 1. مصادقة كلمة المرور للتجار غير موجودة

**الحالة الحالية:** الباك إند يدعم فقط OTP (`POST /api/v1/auth/otp/request` + `POST /api/v1/auth/otp/verify`).

**ما يحتاجه العميل (حسب الصور المرفقة):** نموذج تسجيل دخول بهاتف + **كلمة مرور** (وليس OTP).

**التأثير الحالي في نسخة التسليم الجديدة:** الفرونت يحاول أولًا `POST /auth/login` بالعقد الجديد. إذا أعاد الخادم `404/405/501`، ينتقل مؤقتًا إلى `POST /auth/otp/request` لإبقاء تسجيل الدخول متاحًا. أخطاء بيانات الاعتماد `401` لا تتحول إلى OTP.

**المطلوب إضافته للباك إند:**

```
POST /api/v1/auth/login
Body: { "phone": "+9665XXXXXXXX", "password": "string", "accountType": "MERCHANT" | "INDIVIDUAL" }
Response: { "accessToken": "JWT", "refreshToken": "...", "user": {...} }
```

أو دمج في `verifyOtp` دعم `password` كـ alternative للـ `code`.

---

### 2. حقل `type` غير مدعوم في `/customers`

**الحالة الحالية:** endpoint إنشاء عميل يقبل `name, phone, email, city, address, notes` فقط — لا يوجد تمييز بين "مرسل" و "مستلم".

**ما يحتاجه العميل:** صفحة "دفتر العناوين" مع تبويب منفصل للمرسلين والمستلمين.

**التأثير الحالي:** الواجهة ترسل `type: "SENDER" | "RECEIVER" | "BOTH"` في الـ payload، لكن الباك إند يُرجعه كما هو (إن كان يحفظه) أو يتجاهله.

**المطلوب إضافته للباك إند:**

```typescript
// Add to customer schema:
interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  cityId?: string;       // ← link to /cities (currently just string)
  address?: string;
  notes?: string;
  type: "SENDER" | "RECEIVER" | "BOTH";   // ← NEW FIELD
  shipmentsCount: number;
  createdAt: string;
  updatedAt: string;
}
```

أو إضافة endpoints منفصلة:
- `GET /api/v1/customers/senders` — قائمة المرسلين فقط
- `GET /api/v1/customers/receivers` — قائمة المستلمين فقط

---

### 3. ربط العملاء بـ `cityId` (UUID)

**الحالة الحالية:** حقل `city` في `/customers` هو string حر (مثل "الرياض")، بينما الـ cities لها IDs منفصلة (`cmvjvtoxu0009mnec4twfy8ex`).

**ما يحتاجه العميل:** عند إنشاء شحنة، نحتاج `originCityId` و `destCityId` — يجب أن نربط العميل بالمدينة بشكل صريح.

**التأثير الحالي:** الواجهة تطابق اسم المدينة يدوياً مع قائمة المدن لإيجاد الـ ID.

**المطلوب:** إضافة `cityId` كحقل منفصل في `/customers` ويُتحقق من وجوده في `/public/cities`.

---

## 🟡 ملاحظات مهمة (Important)

### 4. استجابة `/auth/me` لا تُرجع بيانات المتجر

**الحالة الحالية:** `GET /api/v1/auth/me` يُرجع `name, phone, email, accountType, status` فقط.

**ما يحتاجه العميل:** صفحة الملف الشخصي تعرض أيضاً بيانات المتجر (اسم المتجر، الرقم الضريبي، السجل التجاري).

**التأثير الحالي:** نستدعي `GET /stores/me` منفصلاً للحصول على بيانات المتجر.

**المطلوب (اختياري):** دمج بيانات المتجر في `auth/me` لتقليل عدد الطلبات:

```typescript
interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  accountType: "MERCHANT" | "INDIVIDUAL";
  status: "ACTIVE" | "SUSPENDED";
  city?: string;
  address?: string;
  nationalId?: string;
  bankName?: string;
  iban?: string;
  locale: "ar" | "en";
  store?: StoreInfo;     // ← embed store data
  merchant?: {           // ← embed merchant data
    id: string;
    storeName: string;
    status: string;
    balance: number;     // halalas
    balanceHal: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

---

### 5. حقل `paymentMethod` vs `paymentMode` — تضارب في التسمية

**الحالة الحالية:** 
- `/shipments` تقبل `paymentMethod` (camelCase, lowercase)
- `/public/quote` و `/shipments/quote` يقبلان `paymentMode` (uppercase, EN values: "PREPAID" | "COD")

**التأثير الحالي:** الواجهة تُرسل `paymentMode` في كل مكان، لكن قد يحدث تضارب في `/shipments`.

**المطلوب:** توحيد التسمية: استخدم `paymentMode` مع قيم `PREPAID | COD` في كل الـ endpoints ذات الصلة.

---

### 6. حقل `weightGrams` في `/shipments` غير موثّق بوضوح

**الحالة الحالية:** الـ quote endpoint يتوقع `packages[].weightGrams` (بغرام، عدد صحيح).

**التأثير الحالي:** الواجهة تستخدم `weightGrams` بشكل صحيح، لكن قد يحتاج الباك إند توضيح في الـ schema.

**المطلوب:** توثيق الـ schema في OpenAPI:
- `packages[].weightGrams`: عدد صحيح ≥ 100 (100 غرام = 0.1 كجم)
- `packages[].description`: مطلوب، نص
- `packages[].quantity`: اختياري، افتراضي 1

---

## 🟢 ملاحظات تحسينية (Enhancement)

### 7. إضافة `/auth/forgot-password` endpoint

**الحالة:** لا يوجد.

**التأثير:** زر "نسيت كلمة المرور؟" في الواجهة يعرض رسالة "سيتم توفير استعادة كلمة المرور قريباً".

**المطلوب:**
```
POST /api/v1/auth/forgot-password
Body: { "phone": "+9665XXXXXXXX" }
Response: { "expiresInSec": 300 }

POST /api/v1/auth/reset-password
Body: { "phone": "...", "code": "OTP", "newPassword": "..." }
Response: { "ok": true }
```

---

### 8. إضافة `/auth/change-password` للتجار

**الحالة:** يوجد فقط `/auth/staff/change-password` للموظفين.

**المطلوب:** إضافة endpoint مماثل للتجار:
```
POST /api/v1/auth/change-password
Body: { "currentPassword": "...", "newPassword": "..." }
Auth: bearerAuth
Response: { "ok": true }
```

---

### 9. إضافة بحث متقدم في `/shipments`

**الحالة الحالية:** `/shipments` يقبل query params (لا توجد توثيق واضح للأسماء).

**المطلوب:** دعم query params موثّقة:
- `?status=IN_TRANSIT` — فلترة بالحالة
- `?carrierCode=SMSA` — فلترة بالناقل
- `?search=MX-4587` — بحث نصّي
- `?from=2026-01-01&to=2026-12-31` — فلترة بالتاريخ
- `?limit=20&offset=0` — pagination

---

### 10. إضافة `/wallet/cod-summary` موثّق بشكل أوضح

**الحالة:** الـ endpoint موجود لكن الـ response shape غير واضح في OpenAPI.

**المطلوب:** توثيق الاستجابة:
```typescript
interface CodSummary {
  totalCodCollected: number;     // halalas
  totalCodPending: number;       // halalas
  totalCodCancelled: number;     // halalas
  shipmentsCount: number;
}
```

---

## 📋 ملخص الإصلاحات المطلوبة

| # | الأولوية | الـ Endpoint / الحقل | الوصف |
|---|---------|---------------------|------|
| 1 | 🔴 حرج | `POST /auth/login` (جديد) | دعم كلمة المرور للتجار |
| 2 | 🔴 حرج | حقل `type` في `/customers` | تمييز مرسل/مستلم |
| 3 | 🔴 حرج | حقل `cityId` في `/customers` | ربط بالمدن |
| 4 | 🟡 مهم | دمج `store` في `auth/me` | تقليل الطلبات |
| 5 | 🟡 مهم | توحيد `paymentMode` | تسمية موحدة |
| 6 | 🟡 مهم | توثيق `weightGrams` schema | وضوح |
| 7 | 🟢 تحسين | `POST /auth/forgot-password` | نسيان كلمة المرور |
| 8 | 🟢 تحسين | `POST /auth/change-password` للتجار | تغيير كلمة المرور |
| 9 | 🟢 تحسين | بحث متقدم في `/shipments` | فلاتر + pagination |
| 10 | 🟢 تحسين | توثيق `/wallet/cod-summary` | وضوح الـ schema |

---

## ✅ ما يعمل بشكل ممتاز حالياً

- ✅ جميع endpoints العامة (`/public/cities`, `/public/carriers/active`, `/public/track`, `/public/quote`)
- ✅ مصادقة OTP الكاملة (`/auth/otp/request`, `/auth/otp/verify`)
- ✅ بيانات المستخدم (`/auth/me`, `/auth/me` PATCH)
- ✅ الشحنات الكاملة (`/shipments`, `/shipments/{id}`, `/shipments/quote`, `/shipments/{id}/confirm`, `/shipments/{id}/cancel`, `/shipments/{id}/label`)
- ✅ العملاء (`/customers` CRUD)
- ✅ المحفظة الكاملة (`/wallet`, `/wallet/transactions`, `/wallet/topup`, `/wallet/topup/bank-transfer`, `/wallet/cod-summary`)
- ✅ الفواتير (`/invoices`, `/invoices/{id}/pdf`)
- ✅ الإشعارات (`/notifications`, `/notifications/read`)
- ✅ المتجر (`/stores/me`, `/stores/me` PATCH)
- ✅ استجابات الأخطاء ثنائية اللغة (messageAr + messageAr)
- ✅ Rate limiting واضح (429 مع كود RATE_LIMITED)
- ✅ صحة البيانات (51 مدينة، 3 ناقلين، ZATCA-compliant VAT 15%)

---

**ملاحظة:** الواجهة الأمامية جاهزة لاستقبال أي تحديثات على الباك إند. كل الـ endpoints معرّفة في `src/lib/api/endpoints.ts` بشكل type-safe، وعند إضافة أي endpoint جديد، يكفي إضافته هناك + استدعائها في الـ hook المناسب.
