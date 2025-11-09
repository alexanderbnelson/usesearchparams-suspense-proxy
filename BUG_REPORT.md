# Bug Report: Next.js 16 Cache Components + Proxy + useSearchParams Suspense Error

## Summary

Next.js 16.0.1 with `cacheComponents: true` incorrectly requires Suspense boundaries for `useSearchParams()` when used in combination with a Next.js Proxy (middleware) that calls `getToken()` from next-auth. The error occurs during build despite having proper Suspense boundaries at multiple levels.

**Error Message:**
```
⨯ Render in Browser should be wrapped in a suspense boundary at page "/auth/partner-signin"
Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
```

## Environment

- **Next.js**: 16.0.2-canary.12 (Turbopack, Cache Components)
- **React**: 19.2.0
- **React DOM**: 19.2.0
- **next-auth**: 4.24.13
- **Node.js**: v22+
- **Package Manager**: pnpm

## Root Cause

The bug is triggered by the **combination** of:

1. ✅ `cacheComponents: true` in `next.config.ts`
2. ✅ Next.js Proxy (`proxy.ts`) using `getToken()` from `next-auth/jwt`
3. ✅ Root layout that returns `children` directly (no `<html>`/`<body>` wrapper)
4. ✅ Client component using `useSearchParams()`
5. ✅ Multiple Suspense boundaries already in place

## Reproduction Repository

This repository contains a **complete minimal reproduction** that demonstrates the bug.

### File Structure

```
.
├── proxy.ts                           # Next.js Proxy with next-auth
├── next.config.ts                      # cacheComponents: true
├── .env                                # NEXTAUTH_SECRET, NEXT_PUBLIC_ROOT_DOMAIN
├── app/
│   ├── layout.tsx                      # Root layout (returns children only)
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts            # Minimal next-auth setup
│   └── auth/
│       ├── layout.tsx                  # Suspense boundary (1st level)
│       └── partner-signin/
│           ├── page.tsx                # Suspense boundary (2nd level)
│           └── PartnerSignIn.tsx       # Client component with useSearchParams
```

## Reproduction Steps

### 1. Clone and Install

```bash
git clone <this-repo>
cd usesearchparams-suspense
pnpm install
```

### 2. Run Build

```bash
pnpm next build --debug-prerender
```

### 3. Observe Error

```
⨯ Render in Browser should be wrapped in a suspense boundary at page "/auth/partner-signin"
Error occurred prerendering page "/auth/partner-signin"
```

## Key Files

### `proxy.ts` - The Critical Missing Piece

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  matcher: [
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;

  // ... font file handling ...

  const session = await getToken({ req });  // ← This is key!

  // ... routing logic ...
}
```

The `getToken({ req })` call in the proxy appears to interfere with Next.js's ability to correctly identify dynamic routes during the prerender phase.

### `app/layout.tsx` - Unusual Root Layout

```typescript
import "./globals.css";

type LayoutProps = {
  children: React.ReactNode;
};

export default async function RootLayout(props: LayoutProps) {
  const { children } = props;
  return children;  // ← No <html>/<body> wrapper
}
```

This unusual pattern (returning `children` directly) is part of a multi-tenant architecture where different subdomains have different layouts.

### `app/auth/partner-signin/PartnerSignIn.tsx` - Component with useSearchParams

```typescript
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function PartnerSignIn() {
  const searchParams = useSearchParams();  // ← Triggers the error
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // ... component logic ...
}
```

## What We've Verified

### ✅ Multiple Suspense Boundaries Are Present

1. **Layout level** (`app/auth/layout.tsx`):
   ```tsx
   <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
   ```

2. **Page level** (`app/auth/partner-signin/page.tsx`):
   ```tsx
   <Suspense fallback={<div>Loading...</div>}>
     <PartnerSignIn />
   </Suspense>
   ```

3. **Component level** (`PartnerSignIn.tsx`):
   ```tsx
   <Suspense fallback={<div>Loading...</div>}>
     {/* component content */}
   </Suspense>
   ```

Despite having Suspense boundaries at **three different levels**, the build still fails.

### ✅ Route Should Be Dynamic

- The route uses `useSearchParams()` which should automatically opt out of static generation
- The route requires request-time data (query parameters)
- The proxy uses `getToken()` which requires request context

### ✅ Error Only Occurs With All Pieces Combined

Testing confirmed the error **only occurs** when all these are present:
- ❌ Without `proxy.ts` → Build succeeds
- ❌ Without `cacheComponents: true` → Build succeeds
- ❌ Without `getToken()` in proxy → Build succeeds
- ✅ With all pieces → **Build fails**

## Expected Behavior

One of the following should happen:

1. **Best outcome**: Next.js should recognize that:
   - The route has proper Suspense boundaries
   - The route uses `useSearchParams()` and should be dynamic
   - The route should skip prerendering automatically

2. **Acceptable outcome**: If there's a specific pattern required, the error message should explain:
   - What's wrong with the current Suspense setup
   - Which Suspense boundary is missing or incorrect
   - How to fix it

## Actual Behavior

- Build fails with misleading error message
- Error says to add Suspense boundary, but multiple boundaries already exist
- No clear guidance on what's actually wrong

## Questions for Next.js Team

1. Why does the proxy's `getToken()` call interfere with dynamic route detection?
2. Why are multiple Suspense boundaries not sufficient?
3. Should the error message provide more specific guidance when a proxy is involved?
4. Is the unusual root layout pattern (returning children directly) contributing to the issue?

## Impact

This bug affects applications that use:
- Multi-tenant architecture with subdomain routing
- Next.js Proxy for request routing
- next-auth for authentication
- Cache Components (Next.js 16 feature)
- Dynamic routes with search parameters

## Additional Context

- Works correctly in development mode (`next dev`)
- Only fails during production build with `--debug-prerender`
- Error is misleading because Suspense boundaries are already present
- Similar routes without the proxy work fine
- The proxy pattern is documented in Next.js multi-tenant examples

## Related Links

- [Next.js Proxy Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [useSearchParams Documentation](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- [Missing Suspense Error](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout)
- [Cache Components](https://nextjs.org/docs/app/api-reference/next-config-js/cacheComponents)

## System Information

```
Next.js: 16.0.2-canary.12 (Turbopack, Cache Components)
React: 19.2.0
React DOM: 19.2.0
next-auth: 4.24.13
Node.js: v22+
OS: macOS (Darwin 24.6.0)
```

## Tested Versions

- ✅ Bug present in Next.js 16.0.1
- ✅ Bug present in Next.js 16.0.2-canary.12 (latest canary as of 2024-11-09)
