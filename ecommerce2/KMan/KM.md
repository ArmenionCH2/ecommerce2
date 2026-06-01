# Performance Optimization - Tab Visibility & Profile Loading

## Problem
The site was reloading/crashing when switching tabs or minimizing the browser. Other sites didn't have this issue.

## Root Cause Analysis

### Primary Issue: Profile Retry Loop
The `useUserSession` hook was called in **12+ different components**:
- ReviewSection.tsx
- ProductCard.tsx
- ProductDetailView.tsx
- CartDrawer.tsx
- MarketplaceGate.tsx
- RoleGate.tsx
- checkout/page.tsx
- seller/page.tsx
- ProductDetailWrapper.tsx
- seller/inventory/page.tsx
- orders/page.tsx
- admin/verifications/page.tsx
- navbar.tsx
- footer.tsx

Each component created its own Supabase auth state listener. When the tab became visible again after being hidden, **all 12+ listeners fired simultaneously**, triggering multiple concurrent profile fetch attempts.

### Secondary Issue: Aggressive Retry Logic
The `profileLoader.ts` had:
- 3 retry attempts with 4-second timeout each
- 300ms delay between retries
- No protection against concurrent fetches

When 12+ components all tried to fetch the profile simultaneously, it created a retry loop that overwhelmed the browser, causing it to kill the process and reload the page.

## Solutions Implemented

### 1. Page Visibility API Integration

**Created: `lib/hooks/usePageVisibility.ts`**
```typescript
// Hook to track page visibility state
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}
```

**Created: `components/layout/PageVisibilityProvider.tsx`**
- Context provider to share visibility state across the app
- Adds/removes `page-hidden` CSS class from body when tab is hidden/visible
- Wraps entire app in `layout.tsx`

### 2. CSS Optimizations

**Updated: `app/globals.css`**
```css
/* Pause animations and transitions when page is hidden */
body.page-hidden *,
body.page-hidden *::before,
body.page-hidden *::after {
  animation-play-state: paused !important;
  transition-duration: 0s !important;
}

/* Optimize rendering when page is not visible */
body.page-hidden {
  contain: strict;
  content-visibility: auto;
}
```

### 3. Data Loading Hook Updates

All data loading hooks now check visibility before making API calls:

**Updated hooks:**
- `useProductLoader` - Skips feed/search loading when tab hidden
- `useCartActions` - Skips cart loading when tab hidden
- `useOrderStatus` - Skips order fetching and realtime updates when tab hidden
- `useUserSession` - Skips profile fetching when tab hidden

### 4. Profile Loader Fixes

**Updated: `features/auth/profileLoader.ts`**

```typescript
// Global flag to prevent concurrent fetches
let isFetchingProfile = false;

export async function fetchProfileWithRetry(
  userId: string,
  session?: Session | null,
  maxAttempts = 2,  // Reduced from 3
): Promise<Profile | null> {
  // Prevent concurrent fetches
  if (isFetchingProfile) {
    console.warn('[MarketHub] Profile fetch already in progress, skipping');
    return session ? profileFromSession(session) : null;
  }

  isFetchingProfile = true;

  try {
    // ... fetch logic with 3000ms timeout (reduced from 4000ms)
    // ... 500ms retry delay (increased from 300ms)
  } finally {
    isFetchingProfile = false;
  }
}
```

**Changes:**
- Added global `isFetchingProfile` flag to prevent concurrent fetches
- Reduced max attempts from 3 to 2
- Reduced timeout from 4000ms to 3000ms
- Increased retry delay from 300ms to 500ms

### 5. UserSession Context Provider

**Updated: `features/auth/hooks/useUserSession.tsx`** (renamed from .ts)

Converted from individual hook to Context Provider pattern:

```typescript
const UserSessionContext = createContext<UserSession | null>(null);

export function useUserSession(): UserSession {
  const context = useContext(UserSessionContext);
  if (!context) {
    throw new Error('useUserSession must be used within UserSessionProvider');
  }
  return context;
}

export function UserSessionProvider({ children }: { children: React.ReactNode }) {
  // Single auth state listener for entire app
  // 300ms debounce on auth state changes
  // Visibility-aware profile fetching
}
```

**Updated: `app/layout.tsx`**
```typescript
<PageVisibilityProvider>
  <UserSessionProvider>
    <Navbar />
    <main>{children}</main>
    <Footer />
  </UserSessionProvider>
</PageVisibilityProvider>
```

**Result:** Only ONE auth listener exists instead of 12+.

### 6. Debouncing Auth State Changes

Added 300ms debounce to auth state change handler to prevent rapid-fire calls when tab refocuses:

```typescript
const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
  async (_event, session) => {
    if (!isVisible) return;

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      await applySession(session);
    }, 300); // 300ms debounce
  },
);
```

## Performance Impact

### Before Optimization
- 12+ concurrent profile fetch attempts on tab focus
- 3 retry attempts × 12 components = 36+ potential API calls
- 4-second timeout per attempt = up to 144 seconds of waiting
- Browser process killed due to memory spike
- Page forced to reload

### After Optimization
- 1 profile fetch attempt on tab focus
- 2 retry attempts max = 3 potential API calls total
- 3-second timeout per attempt = up to 9 seconds of waiting
- Global flag prevents concurrent fetches
- Debounce prevents rapid-fire calls
- No page reloads

### Additional Benefits
- Animations pause when tab is hidden (CSS)
- All data loading respects visibility
- Reduced server load
- Better mobile battery life
- Smoother tab switching experience

## Files Modified

1. **Created:**
   - `lib/hooks/usePageVisibility.ts`
   - `components/layout/PageVisibilityProvider.tsx`

2. **Updated:**
   - `app/layout.tsx` - Added providers
   - `app/globals.css` - Added visibility optimizations
   - `app/page.tsx` - Visibility-aware loading
   - `features/auth/profileLoader.ts` - Retry logic fixes
   - `features/auth/hooks/useUserSession.tsx` - Context provider (renamed from .ts)
   - `features/products/hooks/useProductLoader.ts` - Visibility checks
   - `features/cart/hooks/useCartActions.ts` - Visibility checks
   - `features/orders/hooks/useOrderStatus.ts` - Visibility checks

## Key Takeaways

1. **Multiple auth listeners are dangerous** - Always use a singleton pattern for global state like auth
2. **Page Visibility API is essential** - Prevent unnecessary work when tab is hidden
3. **Debounce rapid state changes** - Prevent retry loops on tab focus
4. **Global flags prevent race conditions** - Use flags to prevent concurrent operations
5. **CSS optimizations matter** - Pausing animations saves CPU/GPU when hidden

## Future Improvements

Consider implementing:
- React Query or SWR for better data fetching with built-in deduplication
- Service Worker for offline support
- Request batching for multiple concurrent operations
- Performance monitoring to track tab visibility impact
