// filepath: c:\Users\LABED HAJ ALAYA\Desktop\watan\frontend\src\middleware.ts
// frontend/src/middleware.ts
import { NextResponse, NextRequest } from 'next/server';

function redirect(path: string, req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = path;
  url.search = '';
  const res = NextResponse.redirect(url, 302);
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

// استخراج التيننت من الـ host (يدعم localhost و الدومينات العادية)
function extractTenantHost(host: string | null): string | null {
  if (!host) return null;
  const cleanHost = host.toLowerCase();
  const withoutPort = cleanHost.split(':')[0]; // saeed.localhost:3000 -> saeed.localhost
  const parts = withoutPort.split('.');
  if (parts.length < 2) return null;

  // دعم localhost: sub.localhost
  if (parts[parts.length - 1] === 'localhost') {
    if (parts.length === 2) {
      const sub = parts[0];
      if (sub && sub !== 'www' && sub !== 'localhost') return `${sub}.localhost`;
    }
    return null;
  }

  // دومين عادي: sub.domain.tld
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub && !['www', 'app'].includes(sub)) {
      return withoutPort; // أعده كاملاً (sub.example.com)
    }
  }

  return null;
}

export function middleware(req: NextRequest) {
  const { nextUrl, cookies, headers } = req;
  const path = nextUrl.pathname;

  // -------- استخراج وضبط tenant_host (قبل أي منطق آخر) ----------
  const existingTenantCookie = cookies.get('tenant_host')?.value;
  const reqHost = headers.get('host');
  const derivedTenantHost = extractTenantHost(reqHost);

  // سنحتاج رد لتعديل الكوكي لاحقاً إن لزم
  let response: NextResponse | null = null;

  if (!existingTenantCookie && derivedTenantHost) {
    response = NextResponse.next();
    response.cookies.set('tenant_host', derivedTenantHost, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    });
    // يمكن أيضاً تمرير الهيدر للـ fetchات الداخلية (SSR) إن احتجت:
    response.headers.set('X-Tenant-Host', derivedTenantHost);
  }

  // -------- تخطي الأصول وطلبات API ----------
  const isAsset =
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path === '/favicon.ico' ||
    path.startsWith('/assets') ||
    path.startsWith('/static') ||
    path.startsWith('/public') ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|xml|woff2?|ttf|otf)$/.test(path);

  if (isAsset) return response ?? NextResponse.next();

  // طبّق القواعد فقط على تنقّل HTML حقيقي
  const accept = headers.get('accept') || '';
  const isHtml = accept.includes('text/html');
  const secFetchMode = headers.get('sec-fetch-mode') || '';
  const secFetchDest = headers.get('sec-fetch-dest') || '';
  const isNavigate =
    secFetchMode === 'navigate' && (secFetchDest === 'document' || secFetchDest === 'empty');
  if (!isHtml || !isNavigate) return response ?? NextResponse.next();

  // المصادقة
  const token = cookies.get('access_token')?.value || '';
  const role = (cookies.get('role')?.value || '').toLowerCase();
  if (path === '/login' || path === '/register') {
    return response ?? NextResponse.next();
  }
  if (!token) {
    if (path === '/') return response ?? NextResponse.next();
    return redirectToLogin(req);
  }

  // حماية /admin
  if (path.startsWith('/admin')) {
    const allowedAdminRoles = new Set(['admin', 'supervisor', 'owner', 'instance_owner']);
    if (!allowedAdminRoles.has(role)) {
      if (role === 'developer') return redirect('/dev', req);
      return redirect('/', req);
    }
    return response ?? NextResponse.next();
  }

  // حماية /dev
  if (path.startsWith('/dev')) {
    const isDevLike = role === 'developer' || role === 'instance_owner';
    if (!isDevLike) {
      if (['admin', 'supervisor', 'owner'].includes(role)) {
        return redirect('/admin/dashboard', req);
      }
      return redirect('/', req);
    }
    return response ?? NextResponse.next();
}
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|assets|static|public).*)'],
};