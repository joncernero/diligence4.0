'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { MobileNav } from '@/components/MobileNav';
import {
  Home,
  FolderKanban,
  Building2,
  Calendar,
  FileText,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role === 'resident') {
      // Residents have their own portal — keep them out of the PM dashboard
      router.push('/resident');
    }
  }, [isAuthenticated, user, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!isAuthenticated || user?.role === 'resident') {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Properties', href: '/dashboard/properties', icon: Building2 },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
    { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  ];

  return (
    <div className='flex min-h-screen bg-gray-50'>

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-20 bg-black/40 md:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:flex
        `}
        style={{ backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb' }}
      >
        {/* Sidebar header — same height as top bar (h-16) */}
        <div className='h-16 px-6 flex items-center justify-between flex-shrink-0' style={{ backgroundColor: '#081448' }}>
          <div>
            <h1 className='text-lg font-bold text-white tracking-tight'>Diligence</h1>
            <p className='text-xs leading-none mt-0.5' style={{ color: 'rgba(255,255,255,0.6)' }}>
              {user?.department?.replace('_', ' ')}
            </p>
          </div>
          <button
            className='md:hidden p-1 rounded-md hover:bg-white/10'
            style={{ color: 'rgba(255,255,255,0.8)' }}
            onClick={() => setSidebarOpen(false)}
            aria-label='Close menu'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <nav className='flex-1 p-4 space-y-1'>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}>
                <item.icon className='h-5 w-5' />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className='p-4 border-t border-gray-200'>
          <div className='flex items-center gap-3 px-3 py-2 mb-2'>
            <div className='h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium'>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium text-gray-900 truncate'>
                {user?.firstName} {user?.lastName}
              </p>
              <p className='text-xs text-gray-500 truncate'>{user?.role}</p>
            </div>
          </div>
          <Button
            variant='ghost'
            onClick={handleLogout}
            className='w-full justify-start text-gray-700'>
            <LogOut className='h-4 w-4 mr-2' />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className='flex-1 flex flex-col min-w-0'>
        {/* Top Header Bar — same height as sidebar header (h-16) */}
        <header className='h-16 px-4 md:px-8 flex items-center flex-shrink-0' style={{ backgroundColor: '#081448', borderBottom: '1px solid #0a1a5e' }}>
          <div className='flex items-center justify-between md:justify-end w-full'>
            {/* Hamburger — mobile only */}
            <button
              className='md:hidden p-2 rounded-md hover:bg-white/10 text-white'
              onClick={() => setSidebarOpen(true)}
              aria-label='Open menu'
            >
              <Menu className='h-6 w-6' />
            </button>

            {/* App name — mobile only (sidebar handles it on desktop) */}
            <span className='md:hidden text-base font-bold text-white tracking-tight'>
              Diligence
            </span>

            <NotificationBell />
          </div>
        </header>

        {/* Page Content — extra bottom padding on mobile for bottom nav */}
        <main className='flex-1 overflow-auto p-4 pb-24 md:pb-4'>{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
