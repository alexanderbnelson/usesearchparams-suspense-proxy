import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  matcher: [
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;

  // Skip processing for font files
  if (
    url.pathname.includes("/_next/static/fonts/") ||
    url.pathname.match(/\.(ttf|woff|woff2|eot|otf)$/)
  ) {
    return NextResponse.next();
  }

  const hostname = req.headers
    .get("host")!
    .replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams ? `?${searchParams}` : ""}`;

  // Create base response
  let response: NextResponse;

  // Handle app pages
  if (hostname == `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) {
    const session = await getToken({ req });

    if (!session && path !== "/login") {
      const loginUrl = new URL("/login", req.url);
      response = NextResponse.redirect(loginUrl);
    } else if (session && path === "/login") {
      const homeUrl = new URL("/", req.url);
      response = NextResponse.redirect(homeUrl);
    } else {
      const appUrl = new URL(`/app${path === "/" ? "" : path}`, req.url);
      response = NextResponse.rewrite(appUrl);
    }
  }
  // Handle root application
  else if (
    hostname === "localhost:3000" ||
    hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ) {
    const homeUrl = new URL(`/home${path === "/" ? "" : path}`, req.url);
    response = NextResponse.rewrite(homeUrl);
  } else {
    const customUrl = new URL(`/${hostname}${path}`, req.url);
    response = NextResponse.rewrite(customUrl);
  }

  return response;
}
