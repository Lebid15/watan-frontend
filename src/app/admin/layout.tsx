// app/admin/layout.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from './AdminNavbar';
import AdminTopBar from './AdminTopBar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // لوحة العمل تُصمّم على عرض ثابت ثم نُصغّره ليلائم أي شاشة
  const DESIGN_WIDTH = 1280;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);

  const alertMessage =
    'تنبيه: تم تحديث النظام، يرجى مراجعة صفحة الطلبات لمعرفة التفاصيل.';

  // دوماً: scale = عرض الشاشة / العرض التصميمي (لا نتجاوز 1 على الديسكتوب)
  const computeScale = () => {
    const w = Math.max(320, window.innerWidth); // أمان للهواتف الصغيرة جداً
    return Math.min(w / DESIGN_WIDTH, 1);
  };

  const applyLayout = () => {
    if (!wrapperRef.current || !canvasRef.current) return;

    const s = computeScale();
    setScale(s);

    // الارتفاع الحقيقي قبل التصغير
    const unscaledHeight = canvasRef.current.scrollHeight;

    // نعيّن ارتفاع الحاوية الخارجية وفق التصغير لتختفي أي مساحات/سكرول غريب
    wrapperRef.current.style.height = `${unscaledHeight * s}px`;

    // منع استرجاع سكروول قديم عند تغيّر المقياس
    if ('scrollRestoration' in history) {
      try {
        (history as any).scrollRestoration = 'manual';
      } catch {}
    }
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    applyLayout();

    // استجابة لتغيّر المقاس
    const onResize = () => applyLayout();
    window.addEventListener('resize', onResize);

    // في حال تغيّر محتوى الصفحة (صور، جداول…)
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => applyLayout())
        : null;
    if (ro && canvasRef.current) ro.observe(canvasRef.current);

    // إعادة تطبيق بعد تحميل الصور المؤجّلة
    const t1 = setTimeout(applyLayout, 120);
    const t2 = setTimeout(applyLayout, 400);

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(t1);
      clearTimeout(t2);
      ro?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // زر الخروج (في الشريط العلوي)
  const router = useRouter();
  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
    } catch {}
    router.push('/login');
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        width: '100vw',
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      <div
        ref={canvasRef}
        className="admin-mobile-boost" // يحافظ على اتساق النصوص ولا يسمح بتصغير تلقائي
        style={{
          position: 'absolute',
          top: 0,
          left: '50%', // نتمركز أفقياً
          width: `${DESIGN_WIDTH}px`, // العرض التصميمي الثابت
          transform: `translateX(-50%) scale(${scale})`, // تصغير/تكبير كامل اللوحة
          transformOrigin: 'top center',
          transition: 'transform 120ms linear',
          willChange: 'transform',
        }}
      >
        {/* شريط علوي (التنبيه + زر الخروج في الزاوية) */}
        <div className='bg-[var(--toppage)] text-gray-100'>
          <AdminTopBar alertMessage={alertMessage} onLogout={handleLogout} />
        </div>
        

        {/* كبسولتا التنقّل (الأقسام + الأيقونات) */}
        <AdminNavbar />

        {/* محتوى الصفحات */}
        <div className="p-">{children}</div>
      </div>
    </div>
  );
}
