'use client';

import { useEffect, useRef, useState } from 'react';
import AdminNavbar from './AdminNavbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const DESIGN_WIDTH = 1280;
  const THRESHOLD = DESIGN_WIDTH / 2;
  const MIN_SCALE = 0.6;
  const K = 1.8;
  const MOBILE_BREAK = 768;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState<'top center' | 'top right'>('top center');
  const [isMobile, setIsMobile] = useState(false);

  const [alertMessage] = useState<string>(
    'تنبيه: تم تحديث النظام، يرجى مراجعة صفحة الطلبات لمعرفة التفاصيل.'
  );

  const computeScale = (w: number) => {
    if (w <= MOBILE_BREAK) return Math.min(w / DESIGN_WIDTH, 1);
    if (w < THRESHOLD) {
      const s = Math.pow(w / THRESHOLD, K);
      return Math.max(s, MIN_SCALE);
    }
    return 1;
  };

  const applyLayout = () => {
    if (!canvasRef.current || !wrapperRef.current) return;

    const w = window.innerWidth;
    setIsMobile(w <= MOBILE_BREAK);

    const s = computeScale(w);
    setScale(s);
    setOrigin(w <= MOBILE_BREAK ? 'top center' : 'top right');

    const unscaledHeight = canvasRef.current.scrollHeight;
    wrapperRef.current.style.height = `${unscaledHeight * s}px`;

    if ('scrollRestoration' in history) {
      try { (history as any).scrollRestoration = 'manual'; } catch {}
    }
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    applyLayout();
    const t1 = setTimeout(applyLayout, 100);
    const t2 = setTimeout(applyLayout, 350);
    window.addEventListener('resize', applyLayout);
    return () => {
      window.removeEventListener('resize', applyLayout);
      clearTimeout(t1); clearTimeout(t2);
    };
  }, []);

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
        className={isMobile ? 'admin-mobile-boost' : undefined}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: `${DESIGN_WIDTH}px`,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: 'top center',
          transition: 'transform 120ms linear',
          willChange: 'transform',
        }}
      >
        {alertMessage && (
          <div className="text-gray-500 text-center py-2 px-4 text-sm font-medium">
            {alertMessage}
          </div>
        )}

        <AdminNavbar />
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
