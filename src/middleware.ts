
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isInstagramInAppBrowserServer(userAgent: string | null): boolean {
  if (userAgent) {
    // Common patterns for Instagram's in-app browser user agent string
    return /instagram/i.test(userAgent) || /mozilla\/5\.0 \([^)]+\) applewebkit\/[^ ]+ \(khtml, like gecko\) mobile\/[^ ]+ instagram/i.test(userAgent);
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams, origin, search } = request.nextUrl;
  const userAgent = request.headers.get('user-agent');

  // Check if our redirect trick has already been attempted for this request flow
  const hasRedirectAttemptedFlag = searchParams.has('external_redirect_attempted');

  // Only apply the trick if it's an Instagram browser, the flag isn't set, and it's not an API/static asset path
  if (isInstagramInAppBrowserServer(userAgent) && !hasRedirectAttemptedFlag) {
    
    console.log('Detected Instagram in-app browser. Attempting redirect.');
    // More robustly ignore common asset paths and API routes
    if (pathname.startsWith('/_next/') || 
        pathname.startsWith('/api/') || 
        pathname.startsWith('/media/') || 
        pathname.includes('.')) {
      return NextResponse.next();
    }

    // Create redirect HTML for Instagram in-app browser
    const redirectUrl = `${origin}${pathname}${search ? `${search}&` : '?'}external_redirect_attempted=1`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Opening Maya Chat</title>
          <meta charset="utf-8">
          <script>
            window.location.href = "${redirectUrl}";
          </script>
        </head>
        <body>
          <p>Opening Maya Chat...</p>
        </body>
      </html>
    `;

    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="open-maya-chat.html"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
  }

  return NextResponse.next();
}

// Configure the matcher to run on most page routes, excluding API, static assets, etc.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /media/ (local media assets like audio)
     * - and other files with extensions (e.g. .png, .jpg)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|media/|.*\\.[^.]+$).*)',
  ],
};
