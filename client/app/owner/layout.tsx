'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, CheckSquare, Calendar, FileText,
  LogOut, Menu, X,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Overview',      href: '/owner',            icon: LayoutDashboard, exact: true },
  { name: 'Approvals',     href: '/owner/approvals',  icon: CheckSquare },
  { name: 'Schedule',      href: '/owner/schedule',   icon: Calendar },
  { name: 'Daily Reports', href: '/owner/reports',    icon: FileText },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout, initAuth } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Hydrate auth from localStorage on first render
  useEffect(() => { initAuth(); }, []);

  // Auth guard — owners only
  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!['owner', 'client_view', 'admin'].includes(user?.role || '')) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (!isAuthenticated) return null;

  const handleLogout = () => { logout(); router.push('/login'); };

  const isActive = (item: typeof NAV_ITEMS[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

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
        {/* Sidebar header — matches dashboard h-16 */}
        <div
          className='h-16 px-6 flex items-center justify-between flex-shrink-0'
          style={{ backgroundColor: '#081448' }}
        >
          <div>
            <h1 className='text-lg font-bold text-white tracking-tight'>Diligence</h1>
            <p className='text-xs leading-none mt-0.5' style={{ color: 'rgba(255,255,255,0.6)' }}>
              Owner Portal
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

        {/* Nav */}
        <nav className='flex-1 p-4 space-y-1'>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className='h-5 w-5' />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User / logout — matches dashboard footer */}
        <div className='p-4 border-t border-gray-200'>
          <div className='flex items-center gap-3 px-3 py-2 mb-2'>
            <div className='h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium'>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium text-gray-900 truncate'>
                {user?.firstName} {user?.lastName}
              </p>
              <p className='text-xs text-gray-500 truncate'>Owner</p>
            </div>
          </div>
          <Button
            variant='ghost'
            onClick={handleLogout}
            className='w-full justify-start text-gray-700'
          >
            <LogOut className='h-4 w-4 mr-2' />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className='flex-1 flex flex-col min-w-0'>
        {/* Top header bar — matches dashboard h-16 + color */}
        <header
          className='h-16 px-4 md:px-8 flex items-center flex-shrink-0'
          style={{ backgroundColor: '#081448', borderBottom: '1px solid #0a1a5e' }}
        >
          <div className='flex items-center justify-between md:justify-start w-full'>
            {/* Hamburger — mobile only */}
            <button
              className='md:hidden p-2 rounded-md hover:bg-white/10 text-white'
              onClick={() => setSidebarOpen(true)}
              aria-label='Open menu'
            >
              <Menu className='h-6 w-6' />
            </button>
            {/* App name — mobile only */}
            <span className='md:hidden text-base font-bold text-white tracking-tight'>
              Diligence
            </span>
          </div>
        </header>

        {/* Page content — extra bottom padding on mobile for bottom nav */}
        <main className='flex-1 overflow-auto pb-24 md:pb-4'>
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation — matches MobileNav pattern */}
      <nav className='fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 flex md:hidden'>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors ${
                active ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-gray-400'}`} />
              <span className='truncate'>{item.name === 'Daily Reports' ? 'Reports' : item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
