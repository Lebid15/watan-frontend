// frontend/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function redirect(path: string, req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = path;
  url.search = '';
  const res = NextResponse.redirect(url, 302);
  // منع أي كاش لإعادة التوجيهات
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res;
}

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
  const res = NextResponse.redirect(url, 302);
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res;
}

export function middleware(req: NextRequest) {
  const { nextUrl, cookies, headers } = req;
  const path = nextUrl.pathname;

  // تخطّي الأصول وطلبات Next الداخلية و /api
  const isAsset =
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path === '/favicon.ico' ||
    path.startsWith('/assets') ||
    path.startsWith('/static') ||
    path.startsWith('/public') ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|xml|woff2?|ttf|otf)$/.test(path);
  if (isAsset) return NextResponse.next();

  // طبّق القواعد فقط على طلبات صفحات HTML وتنقّل حقيقي (ليس prefetch)
  const accept = headers.get('accept') || '';
  const isHtml = accept.includes('text/html');
  const secFetchMode = headers.get('sec-fetch-mode') || '';
  const secFetchDest = headers.get('sec-fetch-dest') || '';
  const isNavigate =
    secFetchMode === 'navigate' && (secFetchDest === 'document' || secFetchDest === 'empty');
  if (!isHtml || !isNavigate) return NextResponse.next();

  // الكوكيز
  const token = cookies.get('access_token')?.value || '';
  const role  = (cookies.get('role')?.value || '').toLowerCase();

  // DEBUG خفيف (يمكنك التعطيل لاحقًا)
  console.log('[MW]', { path, hasToken: !!token, role, isNavigate });

  // ✅ اسمح دائمًا بزيارة /login و /register (يوقف القفز أثناء التصحيح)
  if (path === '/login' || path === '/register') {
    return NextResponse.next();
  }

  // 🔒 حماية /admin/*
  if (path.startsWith('/admin')) {
    if (!token) return redirectToLogin(req);

    const allowedAdminRoles = new Set(['admin', 'supervisor', 'owner']);
    if (!allowedAdminRoles.has(role)) {
      // مطوّر → لوحته، غير ذلك → الصفحة الرئيسية
      if (role === 'developer') return redirect('/dev', req);
      return redirect('/', req);
    }
    return NextResponse.next();
  }

  // 🔒 حماية /dev/*
  if (path.startsWith('/dev')) {
    if (!token) return redirectToLogin(req);
    if (role !== 'developer') {
      if (['admin', 'supervisor', 'owner'].includes(role)) {
        return redirect('/admin/dashboard', req);
      }
      return redirect('/', req);
    }
    return NextResponse.next();
  }

  // ❌ أزلنا قاعدة "إعادة توجيه المدراء من مناطق المستخدم"
  // كانت تسبب ذهاب/إياب مزعج. يمكن إرجاعها لاحقًا بعد استقرار السلوك.

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|assets|static|public).*)'],
};
