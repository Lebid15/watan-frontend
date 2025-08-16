'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from './AdminNavbar';
import AdminTopBar from './AdminTopBar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const DESIGN_WIDTH = 1280;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // حالات الرسم
  const [mounted, setMounted] = useState(false);      // لمنع اختلاف SSR/CSR
  const [scale, setScale] = useState(1);              // نبدأ 1 على السيرفر
  const [withTransition, setWithTransition] = useState(false);

  const alertMessage = 'تنبيه: تم تحديث النظام، يرجى مراجعة صفحة الطلبات لمعرفة التفاصيل.';

  const computeScale = () => {
    const w = Math.max(320, window.innerWidth);
    return Math.min(w / DESIGN_WIDTH, 1);
  };

  const applyLayout = (animate: boolean) => {
    if (!wrapperRef.current || !canvasRef.current) return;
    const s = computeScale();
    setScale(s);

    // اضبط ارتفاع الغلاف حتى لا يظهر سكرول/فراغات
    const unscaledHeight = canvasRef.current.scrollHeight;
    wrapperRef.current.style.height = `${unscaledHeight * s}px`;

    setWithTransition(animate);
  };

  // بعد الماونت فقط — هكذا لا يوجد أي اختلاف مع SSR في أول Hydration
  useEffect(() => {
    setMounted(true);
    // أول ضبط بدون أنيميشن
    applyLayout(false);

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

  const router = useRouter();
  const handleLogout = () => {
    try { localStorage.removeItem('token'); } catch {}
    router.push('/login');
  };

  // القيم أثناء SSR/قبل الماونت
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: `${DESIGN_WIDTH}px`,
    transform: 'translateX(-50%) scale(1)',  // نفس الشيء في SSR و Hydration الأول
    transformOrigin: 'top center',
    transition: 'none',
    willChange: 'transform',
    visibility: mounted ? 'visible' : 'hidden', // لا نُظهر قبل الضبط
  };

  // بعد الماونت نحقن القيم الفعلية
  if (mounted) {
    baseStyle.transform = `translateX(-50%) scale(${scale})`;
    baseStyle.transition = withTransition ? 'transform 120ms linear' : 'none';
    baseStyle.visibility = 'visible';
  }

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
        style={baseStyle}
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
