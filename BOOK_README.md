# صفحة هبوط كتاب «52 طريقة لتزيد دخلك "من جد"»

مبنية على قالب Evea (Django 5 + Tailwind).

## التشغيل
    pip install -r requirements/local.txt
    python manage.py migrate
    python manage.py runserver        # http://127.0.0.1:8000

## أين أعدّل؟
- النصوص والأرقام والجدول (الـ52 طريقة): `evea/pages/book_data.py`
- تصميم الأقسام: `evea/templates/book/*.html`
- رابط الطلب: متغير البيئة `BOOK_ORDER_URL` (الافتراضي `#order`)
- الغلاف: ضع `evea/static/images/book-cover.png` (نسبة 3:4.2) وسيحلّ محل الغلاف المرسوم
- صورة المؤلف: `evea/static/images/author.jpg`
- الشركاء والآراء: أضفها في `PARTNERS` و`TESTIMONIALS` داخل `book_data.py` (تظهر الأقسام تلقائيًا)
- طلبات العينة تُحفظ في لوحة الإدارة `/admin/` (يلزم `createsuperuser`)

## بعد تعديل الأنماط (Tailwind)
    npm install
    npx gulp styles

## نسخة ثابتة (HTML) للرفع على أي استضافة
    python utility/export_static.py     # تنتج مجلد static_site/
في النسخة الثابتة ضع رابط خدمة نماذج (مثل Formspree) في `action=""` لنموذج العينة داخل index.html.
