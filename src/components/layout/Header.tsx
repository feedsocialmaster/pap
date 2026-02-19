'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingCart, User, Menu, X, Heart } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import SearchModal from '@/components/shop/SearchModal';

const Header: React.FC = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const { isAuthenticated, user, logout } = useAuthStore();
  const { getTotalItems, items: cartItems } = useCartStore();
  const { getTotalItems: getWishlistItems, items: wishlistItems } = useWishlistStore();
  
  // Fix hydration mismatch: defer count to client-side
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [wishlistItemsCount, setWishlistItemsCount] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update counts when cart or wishlist changes
  useEffect(() => {
    if (isClient) {
      setCartItemsCount(getTotalItems());
      setWishlistItemsCount(getWishlistItems());
    }
  }, [cartItems, wishlistItems, isClient, getTotalItems, getWishlistItems]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Tienda Web', href: '/tienda' },
    { name: 'Blog', href: '/blog' },
    { name: '¿Quiénes Somos?', href: '/quienes-somos' },
    { name: 'Contacto', href: '/contacto' },
  ];

  const isActiveLink = (href: string) => {
    return pathname === href;
  };

  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
    // Redirigir a homepage con refresh
    window.location.href = '/';
  };

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white shadow-md`}
      >
        <div className="container-custom">
          <div className="flex items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <div className="hidden md:flex md:flex-col">
              <p className="text-xl font-bold text-dark leading-tight">Paso a Paso</p>
              <p className="text-sm text-gray leading-tight">Shoes</p>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center gap-12 ml-auto">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActiveLink(item.href) 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-dark'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Search Input */}
            <button
              type="button"
              onClick={openSearch}
              className="hidden md:flex items-center gap-2 bg-gray-light/50 rounded-lg px-3 py-2 hover:bg-gray-light transition-colors"
              aria-label="Buscar productos"
            >
              <Search size={18} className="text-gray" />
              <span className="text-sm text-gray-500 w-40 lg:w-48 text-left">Buscar productos...</span>
            </button>

            {/* Search Icon Mobile */}
            <button 
              onClick={openSearch}
              className="md:hidden p-2 hover:bg-primary/10 rounded-full transition-colors"
              aria-label="Buscar"
            >
              <Search size={20} className="text-gray-600 hover:text-primary transition-colors" />
            </button>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link 
                href="/wishlist"
                className="relative p-2 hover:bg-secondary/10 rounded-full transition-colors group"
                aria-label="Lista de deseos"
              >
                <Heart size={20} className="text-gray-600 group-hover:text-secondary transition-colors" />
                {wishlistItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistItemsCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <Link 
              href="/carrito"
              className="relative p-2 hover:bg-primary/10 rounded-full transition-colors group"
              aria-label="Carrito"
            >
              <ShoppingCart size={20} className="text-gray-600 group-hover:text-primary transition-colors" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* User Profile */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-primary/10 rounded-full transition-colors group"
                >
                  <User size={20} className="text-gray-600 group-hover:text-primary transition-colors" />
                  <span className="hidden md:block text-sm font-medium group-hover:text-primary transition-colors">
                    {user.nombre}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 border z-50">
                    <Link
                      href="/perfil"
                      className="block px-4 py-2 text-sm hover:bg-gray-light transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Mi Cuenta
                    </Link>
                    <Link
                      href="/mis-compras"
                      className="block px-4 py-2 text-sm hover:bg-gray-light transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Mis Compras
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-gray-light transition-colors"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="p-2 hover:bg-primary/10 rounded-full transition-colors group inline-flex"
                aria-label="Ingresar"
              >
                <User size={20} className="text-gray-600 group-hover:text-primary transition-colors" />
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 hover:bg-primary/10 rounded-full transition-colors group"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menú"
            >
              {isMobileMenuOpen ? <X size={24} className="text-gray-600 group-hover:text-primary transition-colors" /> : <Menu size={24} className="text-gray-600 group-hover:text-primary transition-colors" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t">
            {navigation.map((item) => {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block py-3 text-sm font-medium transition-colors hover:text-primary ${
                    isActiveLink(item.href) ? 'text-primary' : 'text-dark'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
      </header>

      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
    </>
  );
};

export default Header;
