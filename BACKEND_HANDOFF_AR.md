# وثيقة تسليم مهندس Backend — توسيع عقد API لمنصة Masar X

**الإصدار:** 1.0  
**التاريخ:** 31 أكتوبر 2026  
**النطاق:** العقود التي يحتاجها الفرونت إند للوظائف الإضافية المنفذة في نسخة التسليم  
**لغة الواجهات:** العربية RTL  
**Base URL:** `/api/v1`  

> **تنبيه تعاقدي مهم:** لا تتوفر ضمن حزمة التسليم نسخة سورس Backend أو OpenAPI حديثة يمكن فحصها. لذلك فإن المسارات الخمسة عشر المقترحة (15 route-method combinations) هي **مقترحات تعاقدية جديدة يطلب الفرونت إند تنفيذها**، وليست ادعاءً بأنها موجودة حاليًا في الخادم. يجب على مهندس Backend مقارنتها مع OpenAPI وقاعدة الشفرة قبل اعتمادها، ودمج أي مسار مكرر بدل إنشاء نسخة ثانية.

## 1. ملخص المطلوب

| المجال | عدد المسارات الجديدة | الغرض |
|---|---:|---|
| المصادقة وكلمات المرور | 4 | دخول بكلمة مرور، طلب استعادة، إعادة تعيين، تغيير كلمة المرور |
| حل العنوان المختصر | 1 | البحث بواسطة SPL أو رمز عميل |
| قدرات الناقل | 1 | إرجاع الخدمات والحقول الإضافية المطلوبة حسب الناقل |
| اعتراضات الوزن | 4 | القائمة، الإنشاء، التفاصيل، ربط الأدلة |
| مركز التكاملات | 5 | حالة التكامل، سجل الأحداث، تفاصيل الحدث، بدء/إنهاء ربط WhatsApp |
| **الإجمالي** | **15** | **طرق ومسارات مقترحة جديدة** |

لا نوصي بإضافة مسارين منفصلين للمرسلين والمستلمين. يكفي توسيع `GET /customers` لدعم `type=SENDER|RECEIVER|BOTH`، وإرجاع الحقل `type` لكل سجل.

## 2. قواعد مشتركة للعقد

1. جميع المسارات أدناه تقع تحت `/api/v1`، ويستخدم الفرونت Proxy الحالي.
2. كل المسارات الخاصة بالمستخدم تتطلب `Authorization: Bearer <accessToken>`.
3. المسارات `/integrations*` إدارية فقط: `ADMIN` أو `SUPER_ADMIN`. يجب فرض ذلك في Backend، لا الاكتفاء بإخفاء الرابط في الواجهة.
4. لا تُرسل مفاتيح الناقلين أو الدفع أو Meta Access Tokens إلى المتصفح. ترجع الواجهات حالة الاتصال ومعرفات عامة مسموحًا بعرضها فقط.
5. المبالغ المالية بالهللات (`*_Hal`) والأوزان بالجرام (`*_Grams`) كأعداد صحيحة. لا تعتمد حسابات التسوية على الأرقام التي يرسلها العميل.
6. كل الإنشاءات المالية أو المؤثرة يجب أن تكون ذرّية، قابلة للتكرار الآمن، مع سجل تدقيق `audit log` و`Idempotency-Key` حيث ينطبق.
7. استخدم تنسيق أخطاء موحدًا:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request",
  "messageAr": "بيانات الطلب غير صحيحة",
  "details": [{ "field": "phone", "issue": "invalid_format" }]
}
```

## 3. المواصفات التفصيلية للمسارات الجديدة

### A. المصادقة وكلمات المرور — 4 مسارات

#### A1. تسجيل الدخول بكلمة المرور

`POST /api/v1/auth/login`  
**Auth:** عام (لا Bearer)  
**Body:**

```json
{
  "phone": "+9665XXXXXXXX",
  "password": "long-secret",
  "accountType": "MERCHANT"
}
```

`accountType`: `MERCHANT | INDIVIDUAL`.

**200 Response:** يفضّل أن يطابق `AuthSession` المعتمد في الفرونت:

```json
{
  "accessToken": "<JWT>",
  "refreshToken": "<refresh-token>",
  "expiresAt": 1793450000000,
  "accountType": "MERCHANT",
  "phone": "+9665XXXXXXXX",
  "user": {
    "id": "usr_123",
    "name": "اسم المستخدم",
    "phone": "+9665XXXXXXXX",
    "email": "user@example.com",
    "role": "MERCHANT",
    "accountType": "MERCHANT"
  }
}
```

**الأخطاء:** `400` صيغة غير صحيحة، `401` بيانات اعتماد غير صحيحة، `423` حساب موقوف/مقفل، `429` تجاوز المحاولات. لا تميّز رسالة الخطأ بين رقم غير موجود وكلمة مرور خاطئة.

**متطلب أمني:** تخزين كلمات المرور باستخدام Argon2id أو خوارزمية آمنة معتمدة، ومحدد محاولات، وإبطال الجلسات عند الحاجة. لا يسجل كلمة المرور في Logs.

#### A2. طلب رمز استعادة كلمة المرور

`POST /api/v1/auth/forgot-password`  
**Auth:** عام  
**Body:**

```json
{ "phone": "+9665XXXXXXXX", "accountType": "MERCHANT" }
```

**200 Response:**

```json
{ "ok": true, "expiresInSec": 300, "message": "تم إرسال رمز الاستعادة إن كان الحساب مستحقًا لذلك" }
```

أعد استجابة عامة لا تكشف وجود الحساب من عدمه. يجب أن تكون مدة الرمز محدودة، أحادي الاستخدام، ومربوطًا بالغرض `PASSWORD_RESET` ورقم الجوال.

#### A3. إعادة تعيين كلمة المرور برمز OTP

`POST /api/v1/auth/reset-password`  
**Auth:** عام  
**Body:**

```json
{
  "phone": "+9665XXXXXXXX",
  "accountType": "MERCHANT",
  "code": "123456",
  "newPassword": "new-long-secret"
}
```

**200 Response:** `{ "ok": true, "message": "تم تغيير كلمة المرور" }`

**الأخطاء:** `400` صيغة/سياسة كلمة المرور، `401` رمز غير صحيح، `410` رمز منتهي/مستهلك، `429` حد المحاولات. بعد النجاح أبطِل الرمز والجلسات الأخرى وفق سياسة الأمان.

#### A4. تغيير كلمة المرور للمستخدم المصادق

`POST /api/v1/auth/change-password`  
**Auth:** Bearer user  
**Body:**

```json
{ "currentPassword": "old-secret", "newPassword": "new-long-secret" }
```

**200 Response:** `{ "ok": true }`

تحقق من كلمة المرور الحالية، طبّق السياسة نفسها، أعد المصادقة/أبطل Refresh Tokens القديمة وفق سياسة الخادم. لا تعِد كلمة المرور في أي استجابة.

> توافق رجعي: إذا لم يكن A1 منشورًا بعد، يتعامل الفرونت مع `404/405/501` كإشارة إلى عدم توفر مسار الدخول بكلمة المرور ويطلب OTP عبر المسار القديم. لا يُسمح بتحويل `401` إلى OTP لأن ذلك يخفي خطأ بيانات الاعتماد.

### B. البحث بالعنوان المختصر أو رمز جهة الاتصال — مسار واحد

#### B1. حل الرمز

`GET /api/v1/customers/lookup-by-code?code=RRMA2929`  
**Auth:** Bearer user  
**الغرض:** حل SPL short address أو alias داخلي محفوظ لحساب العميل.

**200 Response:**

```json
{
  "code": "RRMA2929",
  "source": "SPL",
  "resolvedAt": "2026-10-31T14:30:00.000Z",
  "contact": {
    "id": "cus_123",
    "name": "اسم جهة الاتصال",
    "fullName": "الاسم الكامل",
    "phone": "+9665XXXXXXXX",
    "city": "الرياض",
    "cityName": "الرياض",
    "cityId": "city_uuid",
    "address": "العنوان النصي المصرح بعرضه",
    "shortCode": "RRMA2929",
    "type": "BOTH"
  }
}
```

`source`: `SPL | CUSTOMER_ALIAS | CUSTOMER_ID`.

**الأخطاء:** `400` رمز غير صالح، `404` لا يوجد سجل أو عنوان يمكن الوصول إليه، `403` المستخدم غير مخول لهذا السجل. يجب ربط البحث بهوية مالك/جهة الاتصال، وألا يسمح الرمز بتسريب بيانات أشخاص آخرين. لا تُرجع بيانات الهوية الوطنية أو أي حقول حساسة غير لازمة للشحنة.

**حد مهم:** إذا كان SPL Lookup يحتاج خدمة طرف ثالث، ينفذه Backend عبر اعتماد رسمي/مصرح، ولا يكشف بيانات اعتماد مزود العنوان للعميل. لا تعتبر alias داخليًا عنوان SPL حقيقيًا.

### C. تعريف قدرات الناقل والحقول الديناميكية — مسار واحد

#### C1. قدرات وخدمات ناقل

`GET /api/v1/public/carriers/{carrierCode}/capabilities`  
**Auth:** عام؛ يعرض الناقل النشط والحقول المسموح عرضها فقط.

**200 Response:**

```json
{
  "carrier": {
    "id": "car_1",
    "code": "SMSA",
    "nameAr": "سمسا",
    "nameEn": "SMSA",
    "apiMode": "API",
    "codSupported": true,
    "active": true
  },
  "capabilities": ["CREATE_SHIPMENT", "CANCEL_SHIPMENT", "TRACK", "DOWNLOAD_LABEL", "COD_SUPPORTED"],
  "services": [
    { "code": "DOMESTIC", "nameAr": "شحن محلي", "domestic": true, "international": false }
  ],
  "customFields": [
    {
      "key": "landmark",
      "labelAr": "أقرب معلم للمستلم",
      "type": "TEXT",
      "required": false,
      "placeholder": "مثال: بجوار المركز التجاري",
      "helpTextAr": "اكتب وصفًا مختصرًا يساعد المندوب"
    }
  ],
  "updatedAt": "2026-10-31T14:30:00.000Z"
}
```

`customFields[].type`: `TEXT | NUMBER | SELECT | BOOLEAN | DATE`. لحقول `SELECT` أرسل `options: [{label,value}]`. يمكن دعم `min`, `max`, `pattern`, `placeholder`, `helpTextAr`.

**الأخطاء:** `404` ناقل غير نشط أو غير معروف. لا تعِد `apiEndpoint`, username, password, API key, bearer token, client secret أو أي إعداد اعتماد.

### D. اعتراضات الوزن والفوترة — 4 مسارات

#### D1. قائمة الاعتراضات

`GET /api/v1/weight-disputes?status=UNDER_REVIEW&shipmentId=shp_1&limit=50&offset=0`  
**Auth:** Bearer user  
**200 Response:**

```json
{ "data": [ /* WeightDispute[] */ ], "total": 1, "limit": 50, "offset": 0 }
```

كل عنصر يعيد: `id`, `shipmentId`, `trackingNumber`, `carrierCode`, `carrierNameAr`, `reasonCode`, `description`, `status`, `customerMeasuredWeightGrams`, `carrierMeasuredWeightGrams`, `chargeDifferenceHal`, `resolutionMessage`, `attachments`, `createdAt`, `updatedAt`.

`status`: `SUBMITTED | UNDER_REVIEW | NEED_MORE_INFO | APPROVED | REJECTED | CLOSED`.

#### D2. إنشاء اعتراض لشحنة

`POST /api/v1/shipments/{shipmentId}/weight-disputes`  
**Auth:** Bearer owner of shipment  
**Body:**

```json
{
  "reasonCode": "WEIGHT_MISMATCH",
  "description": "أطلب مراجعة الوزن المسجل من الناقل ومقارنته بالوزن قبل التسليم.",
  "customerMeasuredWeightGrams": 3200,
  "requestedReview": true
}
```

`reasonCode`: `WEIGHT_MISMATCH | DIMENSION_MISMATCH | DUPLICATE_CHARGE | OTHER`.

**201 Response:** عنصر `WeightDispute` مع `id` و`status=SUBMITTED`.

**حظر أمني/مالي:** لا تقبل من العميل `carrierMeasuredWeightGrams` أو `chargeDifferenceHal` أو حالة الاعتراض أو قيمة الاسترداد. يستخرج Backend قياسات الناقل من webhook/statement ويحسب فرق الرسم من pricing/ledger، ثم ينشئ قيدًا ماليًا فقط بعد موافقة مخولة أو تسوية مؤكدة. لا تخصم/ترد أموالًا لمجرد إنشاء الاعتراض.

#### D3. تفاصيل اعتراض

`GET /api/v1/weight-disputes/{id}`  
**Auth:** مالك الشحنة أو Staff/Admin مخول.  
**200 Response:** `WeightDispute` كامل.

#### D4. ربط مرفق باعتراض

`POST /api/v1/weight-disputes/{id}/attachments`  
**Auth:** مالك الاعتراض أو Staff مخول.  
**Body:**

```json
{
  "fileId": "file_123",
  "storageKey": "private/weight-disputes/wd_1/evidence.jpg",
  "fileName": "scale-photo.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 481200
}
```

**201 Response:** بيانات المرفق المرتبط، دون منح رابط عام دائم.

الفرونت يعيد استخدام المسار الموجود مسبقًا `POST /api/v1/uploads/presign` بطلب:

```json
{
  "purpose": "WEIGHT_DISPUTE_EVIDENCE",
  "resourceType": "WEIGHT_DISPUTE",
  "resourceId": "wd_1",
  "fileName": "scale-photo.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 481200
}
```

ويحتاج Response متوافقًا مع `PresignedUploadResponse`:

```json
{
  "uploadUrl": "https://private-object-storage.example/signed-put-url",
  "fileId": "file_123",
  "storageKey": "private/weight-disputes/wd_1/evidence.jpg",
  "method": "PUT",
  "headers": { "Content-Type": "image/jpeg" },
  "expiresAt": "2026-10-31T14:45:00.000Z"
}
```

**هذا endpoint موجود أصلًا في قائمة الفرونت؛ المطلوب توسيع سياسة الغرض (`purpose`) وربط الملكية، وليس إضافة مسار presign جديد.** نفّذ allowlist للأنواع، حدًا أقصى 5 ملفات و10MB لكل ملف وفق الواجهة، فحص malware، تحقق MIME من محتوى الملف، انتهاء قصير للرابط، وstorage private.

### E. مركز التكاملات وعمليات Webhooks — 5 مسارات

جميع هذه المسارات تتطلب `ADMIN` أو `SUPER_ADMIN` وتُسجل في Audit Log.

#### E1. ملخص اتصالات التكاملات

`GET /api/v1/integrations`  
**200 Response:**

```json
{
  "connections": [
    { "id": "int_1", "provider": "WHATSAPP", "nameAr": "واتساب للأعمال", "status": "CONNECTED", "connectedAt": "2026-10-31T10:00:00Z", "lastCheckedAt": "2026-10-31T14:00:00Z" },
    { "id": "int_2", "provider": "MOYASAR", "nameAr": "ميسر", "status": "CONNECTED" },
    { "id": "int_3", "provider": "CARRIER", "nameAr": "SMSA", "status": "PENDING" }
  ],
  "whatsapp": {
    "status": "CONNECTED",
    "displayPhoneNumber": "+9665XXXXXXX",
    "verifiedName": "اسم النشاط الموثق",
    "businessAccountId": "redacted_or_public_id",
    "phoneNumberId": "redacted_or_public_id",
    "webhookVerified": true,
    "lastInboundAt": "2026-10-31T13:40:00Z",
    "lastOutboundAt": "2026-10-31T13:45:00Z"
  },
  "updatedAt": "2026-10-31T14:00:00Z"
}
```

`provider`: `WHATSAPP | MOYASAR | PAYPAL | CARRIER`. `status`: `CONNECTED | PENDING | ERROR | NOT_CONFIGURED | DISCONNECTED`.

#### E2. قائمة أحداث التكاملات

`GET /api/v1/integrations/events?provider=WHATSAPP&status=FAILED&limit=30&offset=0`  
**200 Response:** `{ "data": [IntegrationEvent], "total": 0, "limit": 30, "offset": 0 }`.

كل حدث يعيد معلومات تشغيلية آمنة: `id`, `provider`, `eventType`, `direction`, `status`, `externalId`, `resourceType`, `resourceId`, `summaryAr`, `errorCode`, `errorMessageAr`, `occurredAt`, `processedAt`.

#### E3. تفاصيل حدث

`GET /api/v1/integrations/events/{id}`  
**200 Response:** عنصر `IntegrationEvent` بالإضافة إلى `safePayload`, `safeResponse`, `attemptCount`.

يجب تنقية payload/response من Access Tokens، Authorization headers، كلمات المرور، بيانات البطاقات، IBAN، الهوية الوطنية، أرقام الجوال الكاملة وأي PII غير ضروري. استخدم masking قبل الإرجاع والتخزين في الواجهة.

#### E4. بدء ربط واتساب للأعمال (Meta Embedded Signup/OAuth)

`POST /api/v1/integrations/whatsapp/connect`  
**200 Response:**

```json
{
  "authorizationUrl": "https://www.facebook.com/vXX.X/dialog/oauth?...",
  "expiresAt": "2026-10-31T14:10:00Z"
}
```

يُنشئ الخادم `state` عشوائيًا أحادي الاستخدام ومربوطًا بالمسؤول والجلسة، ويكوّن redirect URI من قائمة سماح ثابتة، ويخزن client secret وtoken في secret manager. يجب أن يتحقق الفرونت من أن الرابط HTTPS ومن مضيف Meta الرسمي قبل الانتقال. لا تستقبل أو تخزن Meta token في الفرونت.

**ملاحظة:** OAuth callback route داخل Backend مطلوب لتنفيذ التدفق، لكنه ليس endpoint يستدعيه الفرونت من هذه الطبقة؛ حدّد عنوانه النهائي في إعدادات Meta وBackend.

#### E5. فصل واتساب للأعمال

`POST /api/v1/integrations/whatsapp/disconnect`  
**200 Response:** `{ "ok": true }`.

ألغِ/عطّل token في الخادم، حدّث حالة الاتصال، أوقف إرسال الرسائل، وسجل العملية في Audit Log. لا تحذف سجل الأحداث التاريخي.

## 4. توسيعات لعقود قائمة — لا تنشئ مسارات مكررة

هذه الحقول والمسارات ليست endpoints جديدة؛ هي توسيعات للعقود المستخدمة بالفعل في الفرونت:

### 4.1 `POST /api/v1/shipments/quote`

تأكد من قبول `packages[]` لكل قطعة بالحقول:

```json
{
  "weightGrams": 3200,
  "length": 30,
  "width": 20,
  "height": 20,
  "description": "وصف المحتويات",
  "quantity": 2
}
```

احسب الوزن الحجمي وفق اتفاقية الناقل (مثل divisor 5000 أو 6000 بحسب المنتج)، والوزن القابل للفوترة = قاعدة الناقل المعتمدة من مجموع الأوزان. لا تثبت قاسمًا عالميًا في Backend. أعِد `weightBreakdown.actualGrams`, `volumetricGrams`, `chargeableGrams`, وإجمالي السعر شامل VAT وCOD fees وفق قواعد التسعير.

### 4.2 `POST /api/v1/shipments`

وسّع جسم إنشاء الشحنة بقبول `senderAddressCode`, `receiverAddressCode`, `carrierFields`, وأبعاد جميع القطع. تحقق من أن `carrierFields` لا تحتوي سوى المفاتيح المنشورة من `GET /public/carriers/{code}/capabilities`. لا تثق بالسعر المرسل من المتصفح؛ أعد التسعير في الخادم قبل إصدار البوليصة.

### 4.3 `/api/v1/customers` (CRUD)

وسّع Customer schema وعمليات CRUD لدعم:
- `type: SENDER | RECEIVER | BOTH`
- `cityId` كمعرّف مرجعي موثق من `/public/cities`
- `shortCode` للرمز/alias المصرح به
- دعم `GET /customers?type=SENDER&cityId=...&limit=...&offset=...`

لا حاجة إلى `/customers/senders` و`/customers/receivers` إذا أمكن دعم الفلترة بشكل صحيح.

### 4.4 `/api/v1/shipments` — البحث والترقيم

وثّق معايير `status`, `carrierCode`, `search`, `from`, `to`, `limit`, `offset`، مع فحص حدود التواريخ وترقيم مستقر. أعد `{data,total,limit,offset}`.

### 4.5 `/api/v1/auth/me` و`/api/v1/stores/me`

تأكد أن تحديث الملف الشخصي يقبل `bankName` و`iban` إذا كانت سياسة العمل تسمح بذلك، وأن بيانات المتجر تحفظ عبر `/stores/me` أو دمج موثق في `/auth/me`. لا تجعل `iban` عامًا ولا ترجعه إلا لصاحب الحساب والموظفين المخولين.

### 4.6 `POST /api/v1/uploads/presign`

المسار موجود مسبقًا. أضف `WEIGHT_DISPUTE_EVIDENCE` كقيمة مسموحة للـ purpose، مع شروط ملكية الاعتراض ونوع المورد وحدود الحجم.

## 5. Webhooks الموجودة أصلًا — تحسين التحقق وليس إضافة مسارات

توجد في تعريف الفرونت مسارات Webhooks التالية بالفعل؛ لا تنشئ مسارًا ثانيًا لها:

- `GET/POST /api/v1/webhooks/whatsapp` — GET challenge verification من Meta، وPOST يتحقق من `X-Hub-Signature-256` باستخدام raw request body.
- `POST /api/v1/webhooks/moyasar` — تحقق من توقيع/سر webhook حسب آلية المزود، ومنع إعادة التشغيل، وربط الدفع بمعاملة wallet واحدة.
- `POST /api/v1/webhooks/carriers/{code}` — تحقق من توقيع الناقل/مصدره، وتحقق من معرف الحدث، ومعالجة idempotent لتحديثات الشحنة والوزن.

يجب أن تكون معالجة Webhook قابلة للتكرار الآمن، وتعيد 2xx فقط بعد قبول الحدث في queue أو تسجيله بشكل دائم. لا تعتمد على عنوان IP وحده كوسيلة تحقق.

## 6. متطلبات مشتركة للمرفقات والأمان والتدقيق

- `Authorization` Bearer في كل مسار خاص بالمستخدم أو الإدارة.
- `Idempotency-Key` في إنشاء الاعتراض وربط أثر مالي أو طلبات متكررة ذات أثر.
- تحقق server-side من ملكية الشحنة والاعتراض والمرفق.
- عدم كشف أسرار الناقل/Meta/Moyasar/PayPal في HTML أو API responses أو logs.
- PII وملفات الاعتراضات خاصة، صلاحيات تنزيل مؤقتة، تشفير at-rest وin-transit، سياسة احتفاظ/حذف.
- Webhook signature verification على raw body قبل JSON transformation، idempotency على provider event id.
- سجل تدقيق لكل تغيير في الاتصال، تسوية الوزن، قرار الاعتراض، وتغيير كلمة المرور.
- لا يتم رد/خصم مبالغ بسبب مدخل واجهة فقط. كل حركة محفظة مرتبطة بقيد ledger مرجعي وبحدث ناقل/قرار موظف مخول.

## 7. ترتيب التنفيذ المقترح

| الأولوية | المجال | ما يجب أن ينجز قبل الانتقال |
|---|---|---|
| P0 | A1 تسجيل الدخول، A4 تغيير كلمة المرور | مصادقة سليمة وسياسة كلمات مرور واختبار تدفق الدخول |
| P0 | B1 البحث بالرمز | ملكية السجلات، SPL/alias source، عدم تسريب بيانات |
| P0 | C1 قدرات الناقل | منع إنشاء شحنات بمتطلبات ناقل مجهولة |
| P1 | D1-D4 الاعتراضات والمرفقات | دورة كاملة مع تخزين خاص ومراجعة دون خصم تلقائي غير مخول |
| P1 | توسيع quote/create/customers | حساب السعر والوزن والتحقق من الحقول والعناوين بالخادم |
| P1 | E1-E5 إدارة التكاملات | صلاحيات الإدارة وإدارة الأسرار والتدقيق |
| P2 | A2-A3 استعادة كلمة المرور | OTP purpose-specific، أحادي الاستخدام، rate limits |
| P2 | Webhook hardening | التوقيع، idempotency، retries، monitoring |

## 8. معايير قبول تسليم Backend

1. نشر OpenAPI 3.1 محدث يطابق أسماء المسارات وMethods والـ schemas الفعلية.
2. توفير Postman collection أو integration tests لكل مسار جديد.
3. اختبارات نجاح وفشل للصلاحيات (USER/STAFF/ADMIN/SUPER_ADMIN) وملكية السجل.
4. اختبارات replay وduplicate delivery لكل Webhook.
5. إثبات أن tokens وأسرار الناقلين غير موجودة في response أو browser storage أو logs.
6. اختبارات رفع ملف صالح/نوع غير مسموح/حجم زائد/رابط منتهي/مرفق يخص مستخدمًا آخر.
7. اختبار E2E من الواجهة: lookup → إنشاء شحنة؛ إنشاء اعتراض → رفع دليل → ربط المرفق → متابعة الحالة؛ إدارة تكامل → بدء ربط Meta → webhook verified.
8. اختبار مالي يثبت عدم إنشاء أي خصم/رد قبل مصدر تسوية موثوق أو قرار معتمد.

## 9. ملفات الواجهة ذات الصلة

- `src/lib/api/endpoints.ts` — أسماء المسارات والـ path builders.
- `src/lib/api/services.ts` — دوال الخدمات وأنواع الطلب/الاستجابة.
- `src/types/api.ts` — DTOs والـ enums.
- `src/components/pages/AddressLookupPage.tsx` — واجهة lookup.
- `src/components/pages/WeightDisputesPage.tsx` — الاعتراضات والمرفقات.
- `src/components/pages/CarrierCapabilitiesPage.tsx` — قدرات الناقل والحقول.
- `src/components/pages/IntegrationsPage.tsx` — مركز التكاملات وسجل الأحداث.
- `src/components/auth/LoginForm.tsx` — الدخول واستعادة كلمة المرور.
- `src/components/pages/ProfilePage.tsx` — تغيير كلمة المرور.
- `src/components/pages/CreateShipmentPage.tsx` — إرسال رموز العنوان وحقول الناقل الإضافية.

## 10. حدود هذا التسليم

الفرونت يحتوي Mock behavior في `NEXT_PUBLIC_API_MODE=demo` لتجربة التفاعلات. هذه البيانات لا تعني وجود التكامل الحقيقي. عند `NEXT_PUBLIC_API_MODE=real` ترسل طبقة الخدمات الطلبات إلى المسارات أعلاه، وستظهر أخطاء API إلى المستخدم إذا لم يطبقها Backend. لا تعتبر هذه الوثيقة إثباتًا لتكامل Meta أو SPL أو شركات الشحن أو بوابات الدفع؛ إثبات ذلك يتطلب مفاتيح وبيئة Sandbox/Production معتمدة واختبارات حية.
