'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, LogOut, ShieldAlert, Store, ShoppingBag, Menu, X } from 'lucide-react';
import { useUserSession } from '@/features/auth/hooks/useUserSession';
import { signOut } from '@/features/auth/authClient';
import { useCartActions } from '@/features/cart/hooks/useCartActions';
import { useSellerOrders } from '@/features/orders/hooks/useSellerOrders';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SigninForm } from '@/features/auth/components/SigninForm';
import { SignupForm } from '@/features/auth/components/SignupForm';
import { CartDrawer } from '@/features/cart/components/CartDrawer';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { BRAND_EMOJI, BRAND_NAME } from '@/lib/branding';
import { getHomePathForRole, canBrowseMarketplace } from '@/lib/roleRoutes';

export function Navbar() {
  const { user, isAdmin, isSeller, isCustomer } = useUserSession();
  const [authModal, setAuthModal] = useState<'signin' | 'signup' | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Safely hook cart items. If no user or user is not a customer, hook is safe
  const customerId = user && user.role === 'customer' ? user.id : null;
  const { cartItems } = useCartActions(customerId);
  const cartCount = cartItems.length; // Count unique items, not total quantity

  // Hook seller orders for notification badge
  const sellerId = user && user.role === 'seller' ? user.id : null;
  const { unreadCount: sellerUnreadCount } = useSellerOrders(sellerId);

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
    window.location.href = '/';
  };

  const homeHref = getHomePathForRole(user?.role);
  const showMarketplace = canBrowseMarketplace(user?.role);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href={homeHref} className="flex items-center gap-2 transition-transform hover:scale-102">
            <span className="text-2xl font-extrabold tracking-tight bg-linear-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              {BRAND_NAME}
            </span>
            <span className="text-xl">{BRAND_EMOJI}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {showMarketplace && (
              <Link href="/" className="text-sm font-semibold text-gray-600 hover:text-emerald-600 transition-colors">
                Marketplace
              </Link>
            )}

            {(!user || isCustomer) && (
              <Link href="/seller/apply" className="text-sm font-semibold text-gray-600 hover:text-emerald-600 transition-colors">
                Become a Seller
              </Link>
            )}

            {user && (
              <>
                {isCustomer && (
                  <Link href="/orders" className="text-sm font-semibold text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4" />
                    My Orders
                  </Link>
                )}
                {isSeller && (
                  <Link href="/seller" className="text-sm font-semibold text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                    <Store className="w-4 h-4" />
                    Seller Center
                  </Link>
                )}
                {isSeller && (
                  <Link href="/seller/orders" className="text-sm font-semibold text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-1.5 relative">
                    <ShoppingBag className="w-4 h-4" />
                    Orders
                    {sellerUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-sm">
                        {sellerUnreadCount}
                      </span>
                    )}
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className="text-sm font-semibold text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Actions Bar */}
          <div className="flex items-center gap-4">
            {/* Notification Bell (all logged-in users) */}
            {user && <NotificationBell userId={user.id} />}

            {/* Cart Icon (Customers only) */}
            {(!user || isCustomer) && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-full transition-all duration-200"
                aria-label="Open Cart"
              >
                <ShoppingCart className="w-5.5 h-5.5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-sm animate-bounce">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth Dropdown / Button */}
            {user ? (
              <div className="hidden md:flex items-center gap-4 pl-2 border-l border-gray-100">
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{user.role}</p>
                  <p className="text-sm font-bold text-gray-800">{user.full_name}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2.5 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all duration-200 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-5.5 h-5.5" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setAuthModal('signin')}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => setAuthModal('signup')}>
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-full md:hidden transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white py-4 px-6 space-y-4 shadow-inner">
            {showMarketplace && (
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-base font-semibold text-gray-600 hover:text-emerald-600"
              >
                Marketplace
              </Link>
            )}

            {(!user || isCustomer) && (
              <Link
                href="/seller/apply"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-base font-semibold text-gray-600 hover:text-emerald-600"
              >
                Become a Seller
              </Link>
            )}

            {user ? (
              <>
                {isCustomer && (
                  <Link
                    href="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-base font-semibold text-gray-600 hover:text-emerald-600"
                  >
                    My Orders
                  </Link>
                )}
                {isSeller && (
                  <Link
                    href="/seller"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-base font-semibold text-gray-600 hover:text-emerald-600"
                  >
                    Seller Center
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-base font-semibold text-gray-600 hover:text-emerald-600"
                  >
                    Admin Panel
                  </Link>
                )}

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{user.role}</p>
                    <p className="text-sm font-bold text-gray-800">{user.full_name}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSignOut} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Button variant="outline" className="w-full" onClick={() => { setAuthModal('signin'); setIsMobileMenuOpen(false); }}>
                  Sign In
                </Button>
                <Button className="w-full" onClick={() => { setAuthModal('signup'); setIsMobileMenuOpen(false); }}>
                  Get Started
                </Button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Auth Dialog Overlay */}
      <Dialog open={authModal !== null} onOpenChange={(open) => !open && setAuthModal(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
          {authModal === 'signin' && (
            <SigninForm
              onSuccess={() => setAuthModal(null)}
              onToggleForm={() => setAuthModal('signup')}
            />
          )}
          {authModal === 'signup' && (
            <SignupForm
              onSuccess={() => setAuthModal(null)}
              onToggleForm={() => setAuthModal('signin')}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
