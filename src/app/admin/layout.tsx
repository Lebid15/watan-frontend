// app/admin/layout.tsx
'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from './AdminNavbar';
import AdminTopBar from './AdminTopBar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const DESIGN_WIDTH = 1280;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // مهم: اجعل الحالة الابتدائية مطابقة تمامًا لما يخرجه السيرفر
  // (scale = 1 و visibility = hidden) لتجنّب أي اختلاف في الترطيب.
  const [scale, setScale] = useState(1);             // كان يحسب window قبل الترطيب → سبب التحذير
  const [ready, setReady] = useState(false);         // إخفاء حتى التهيئة
  const [withTransition, setWithTransition] = useState(false);

  const alertMessage = 'تنبيه: تم تحديث النظام، يرجى مراجعة صفحة الطلبات لمعرفة التفاصيل.';

  const computeScale = () => {
    const w = Math.max(320, window.innerWidth);
    return Math.min(w / DESIGN_WIDTH, 1);
  };

  const applyLayout = (useAnim: boolean) => {
    if (!wrapperRef.current || !canvasRef.current) return;

    const s = computeScale();
    setScale(s);

    // الارتفاع الحقيقي قبل التصغير
    const unscaledHeight = canvasRef.current.scrollHeight;
    wrapperRef.current.style.height = `${unscaledHeight * s}px`;

    setWithTransition(useAnim); // نفعّل Transition في تغييرات لاحقة فقط
  };

  // نحسب قبل الطلاء الأول على المتصفح لمنع القفزة
  // NOTE: هذا لن يعمل على السيرفر، لذا القيمة الابتدائية بقيت 1 (متطابقة مع SSR).
  useLayoutEffect(() => {
    applyLayout(false);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // استجابة لتغيّر المقاس/المحتوى
  useEffect(() => {
    const onResize = () => applyLayout(true);
    window.addEventListener('resize', onResize);

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => applyLayout(true))
        : null;
    if (ro && canvasRef.current) ro.observe(canvasRef.current);

    return () => {
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // زر الخروج
  const router = useRouter();
  const handleLogout = () => {
    try { localStorage.removeItem('token'); } catch {}
    router.push('/login');
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      <div
        ref={canvasRef}
        className="admin-mobile-boost"
        // يمنع تحذير React لو تغيّر style مباشرة بعد الترطيب
        suppressHydrationWarning
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: DESIGN_WIDTH, // React سيحولها إلى px بشكل ثابت
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: 'top center',
          transition: withTransition ? 'transform 120ms linear' : 'none',
          willChange: 'transform',
          visibility: ready ? 'visible' : 'hidden', // لا نعرض قبل التهيئة
        }}
      >
        <div className="bg-[var(--toppage)] text-gray-100">
          <AdminTopBar alertMessage={alertMessage} onLogout={handleLogout} />
        </div>

        <AdminNavbar />

        <div className="p-">{children}</div>
      </div>
    </div>
  );
}
