// frontend/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

function redirect(path: string, req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = path;
  url.search = ''; // تنظيف الاستعلام
  return NextResponse.redirect(url);
}

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const path = nextUrl.pathname;

  const token = cookies.get('access_token')?.value || '';
  const role  = cookies.get('role')?.value || '';

  // مناطق الواجهة الخاصة بالمستخدم العادي
  const userAreas = [
    '/', '/product', '/orders', '/wallet', '/notifications',
    '/payments', '/user', '/integrations', '/register', '/login',
  ];
  const isInUserArea = userAreas.some(
    (base) => path === base || path.startsWith(base + '/')
  );

  // حماية /admin/* → فقط admin
  if (path.startsWith('/admin')) {
    if (!token) return redirectToLogin(req);
    if (role !== 'admin') {
      // مطوّر → ودّه للوحة المطوّر، غير ذلك → تسجيل الدخول
      return role === 'developer' ? redirect('/dev', req) : redirectToLogin(req);
    }
    return NextResponse.next();
  }

  // حماية /dev/* → فقط developer
  if (path.startsWith('/dev')) {
    if (!token) return redirectToLogin(req);
    if (role !== 'developer') {
      // أدمن يحاول دخول /dev → أرسله للوحة الأدمن
      if (role === 'admin') return redirect('/admin/dashboard', req);
      // غير ذلك → تسجيل الدخول
      return redirectToLogin(req);
    }
    return NextResponse.next();
  }

  // إن كان أدمن ودخل أي صفحة مستخدم عادي → أعد توجيهه للوحة الأدمن
  if (token && role === 'admin' && isInUserArea) {
    return redirect('/admin/dashboard', req);
  }

  // باقي المسارات غير محمية
  return NextResponse.next();
}

// matcher لتشغيل الميدلوير فقط حيث نحتاجه
export const config = {
  matcher: [
    '/admin/:path*',
    '/dev/:path*',
    '/',                    // الصفحة الرئيسية
    '/product/:path*',
    '/orders',
    '/wallet',
    '/notifications',
    '/payments/:path*',
    '/user/:path*',
    '/integrations/:path*',
    '/login',
    '/register',
  ],
};
