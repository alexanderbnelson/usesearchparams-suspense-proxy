# Next.js 16 Bug Reproduction: Cache Components + Proxy + useSearchParams

This repository contains a **minimal reproduction** of a bug in Next.js 16.0.1 where the combination of Cache Components, Next.js Proxy with next-auth, and `useSearchParams()` incorrectly triggers a "missing Suspense boundary" error during build, despite multiple Suspense boundaries being properly implemented.

## 🐛 The Bug

**Error Message:**
```
⨯ Render in Browser should be wrapped in a suspense boundary at page "/auth/partner-signin"
```

**What Triggers It:**
- ✅ `cacheComponents: true` in next.config.ts
- ✅ Next.js Proxy (`proxy.ts`) using `getToken()` from next-auth/jwt
- ✅ Root layout that returns `children` directly (no html/body wrapper)
- ✅ Client component using `useSearchParams()`
- ✅ Multiple Suspense boundaries already present

See [`BUG_REPORT.md`](./BUG_REPORT.md) for complete details.

## 🚀 Quick Start

### Reproduce the Bug

```bash
# Install dependencies
pnpm install

# Run build with debug prerender
pnpm next build --debug-prerender
```

**Expected Result:** Build fails with the Suspense boundary error.

### Verify It's the Proxy

```bash
# Temporarily disable proxy
mv proxy.ts proxy.ts.bak

# Build should succeed now
pnpm next build --debug-prerender

# Restore proxy
mv proxy.ts.bak proxy.ts
```

## 📁 Key Files

- **`proxy.ts`** - Next.js Proxy with next-auth (triggers the bug)
- **`app/auth/partner-signin/PartnerSignIn.tsx`** - Client component using `useSearchParams()`
- **`app/auth/layout.tsx`** - Suspense boundary (1st level)
- **`app/auth/partner-signin/page.tsx`** - Suspense boundary (2nd level)
- **`next.config.ts`** - Cache Components enabled
- **`.env`** - Required environment variables

```typescript
// app/auth/partner-signin/page.tsx
export const dynamic = 'force-dynamic';
```

However, this should not be necessary given the multiple Suspense boundaries and dynamic nature of the route.

## 📚 Documentation

- **[BUG_REPORT.md](./BUG_REPORT.md)** - Complete bug report with analysis
- **[CLAUDE.md](./CLAUDE.md)** - Technical guidance for AI assistants

## 🛠️ Tech Stack

- Next.js 16.0.2-canary.12 (Turbopack, Cache Components)
- React 19.2.0
- next-auth 4.24.13
- TypeScript 5.x

## ✅ Tested Versions

- Bug confirmed in Next.js 16.0.1
- Bug confirmed in Next.js 16.0.2-canary.12 (latest canary)

## 📝 Notes

- This is a bug reproduction repository, not a production application
- The bug has been successfully reproduced and verified
- All components (proxy, Cache Components, next-auth) are required to trigger the bug
- Removing any single piece causes the build to succeed
