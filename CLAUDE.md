# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

This is a **complete minimal reproduction** for a Next.js 16 bug involving the combination of:
- Cache Components (`cacheComponents: true`)
- Next.js Proxy with next-auth (`getToken()`)
- `useSearchParams()` in client components
- Multiple Suspense boundaries

The bug causes a false positive "missing Suspense boundary" error during build despite proper Suspense boundaries being present at multiple levels.

**Key Context**: This is not a production application—it's a verified bug reproduction repository. See `BUG_REPORT.md` for complete details.

## Technology Stack

- **Next.js**: 16.0.1 (App Router with Turbopack)
- **React**: 19.2.0
- **next-auth**: 4.24.13 (critical for reproduction)
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS v4 (PostCSS)
- **Linting**: ESLint 9 with Next.js config

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Production build with debug output (important for bug reproduction)
npm run build -- --debug-prerender

# Start production server
npm start

# Run linter
npm run lint
```

## Project Architecture

### File Structure

```
.
├── proxy.ts                           # Next.js Proxy with next-auth (CRITICAL)
├── next.config.ts                      # cacheComponents: true
├── .env                                # NEXTAUTH_SECRET, NEXT_PUBLIC_ROOT_DOMAIN
├── app/
│   ├── layout.tsx                      # Unusual: returns children only (no html/body)
│   ├── page.tsx                        # Home page (default template)
│   ├── globals.css                     # Global Tailwind styles
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts            # Minimal next-auth setup
│   └── auth/
│       ├── layout.tsx                  # Suspense boundary (1st level)
│       └── partner-signin/
│           ├── page.tsx                # Suspense boundary (2nd level)
│           └── PartnerSignIn.tsx       # Client component with useSearchParams

BUG_REPORT.md                           # Complete bug report and analysis
```

### The Bug - Successfully Reproduced

**Error Message:**
```
⨯ Render in Browser should be wrapped in a suspense boundary at page "/auth/partner-signin"
```

**What Triggers It:**

The bug ONLY occurs when ALL of these are present:
1. ✅ `cacheComponents: true` in next.config.ts
2. ✅ `proxy.ts` file using `getToken()` from next-auth/jwt
3. ✅ Root layout that returns `children` directly (no html/body wrapper)
4. ✅ Client component using `useSearchParams()`
5. ✅ Multiple Suspense boundaries already in place

**Key Insight:** The `proxy.ts` file with `getToken({ req })` was the missing piece. The proxy interferes with Next.js's ability to detect dynamic routes during prerender.

### Verified Suspense Boundaries

Despite having Suspense boundaries at THREE levels:
1. Layout level: `app/auth/layout.tsx`
2. Page level: `app/auth/partner-signin/page.tsx`
3. Component level: Inside `PartnerSignIn.tsx`

...the build still fails with the "missing Suspense" error.

### Workaround

Add `export const dynamic = 'force-dynamic'` to the page component, but this should not be necessary given:
- Multiple Suspense boundaries exist
- `useSearchParams()` should auto-mark route as dynamic
- Proxy uses request-time data

## Configuration Files

### proxy.ts (THE CRITICAL FILE)
- Next.js Proxy/middleware that routes requests based on subdomain
- Uses `getToken({ req })` from next-auth/jwt to check authentication
- Matches almost all routes: `"/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)"`
- **This is what triggers the bug** when combined with Cache Components

### next.config.ts
- `cacheComponents: true` - **REQUIRED** to reproduce the bug
- `poweredByHeader: false`
- `experimental.serverActions` configuration

### .env
- `NEXTAUTH_SECRET` - Required for next-auth
- `NEXT_PUBLIC_ROOT_DOMAIN` - Used by proxy for subdomain routing

### tsconfig.json
- Target: ES2017
- JSX: react-jsx (React 19 JSX transform)
- Path alias: `@/*` maps to project root

### eslint.config.mjs
- Uses new ESLint flat config format
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

### postcss.config.mjs
- Single plugin: `@tailwindcss/postcss` (Tailwind v4 integration)

## Reproducing the Bug

**To trigger the error:**
```bash
npm run build -- --debug-prerender
```

**Expected output:**
```
⨯ Render in Browser should be wrapped in a suspense boundary at page "/auth/partner-signin"
Error occurred prerendering page "/auth/partner-signin"
```

**To verify it's fixed (after removing proxy.ts):**
```bash
# Temporarily rename proxy.ts
mv proxy.ts proxy.ts.bak
npm run build -- --debug-prerender
# Build should succeed
mv proxy.ts.bak proxy.ts
```

## Important Notes

1. **This is a verified bug reproduction**: The bug has been successfully reproduced with all necessary components in place.

2. **All pieces are required**: Removing any single piece (proxy.ts, cacheComponents, next-auth, unusual root layout) causes the build to succeed.

3. **The proxy is the key**: The `getToken({ req })` call in proxy.ts interferes with Next.js's dynamic route detection during prerender.

4. **Multi-tenant architecture**: The unusual root layout (returning children only) is part of a multi-tenant pattern where subdomains have different layouts.

## MCP Tools Available

This project has the **nextdevtools MCP** installed, which provides powerful debugging and analysis capabilities for Next.js projects:

- **Route Analysis**: Inspect Next.js route structure and configuration
- **Build Inspection**: Analyze build output, bundle sizes, and optimization
- **Performance Metrics**: Check rendering performance and identify bottlenecks
- **Cache Debugging**: Examine caching behavior (particularly useful for investigating the Cache Components bug)
- **Component Tree**: Visualize component hierarchy and client/server boundaries

The nextdevtools MCP is particularly valuable for this bug reproduction project as it can help analyze:
- Why prerendering is being attempted on dynamic routes
- How Cache Components affects route generation
- Component rendering boundaries and Suspense behavior

## Related Documentation

- **Primary documentation**: `BUG_REPORT.md` - Complete analysis and reproduction steps
- Next.js 16 docs: https://nextjs.org/docs
- React 19 Suspense changes: https://react.dev/reference/react/Suspense
- Next.js Proxy/Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
- Cache Components: https://nextjs.org/docs/app/api-reference/next-config-js/cacheComponents
