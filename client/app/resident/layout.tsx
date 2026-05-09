'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, Calendar, Home, LogOut, Wrench, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) { router.push('/login'); return; }
    const parsed = JSON.parse(user);
    if (parsed.role !== 'resident') router.push('/dashboard');
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const navItems = [
    { href: '/resident', label: 'Home', icon: Home },
    { href: '/resident/bulletins', label: 'Bulletins', icon: Bell },
    { href: '/resident/calendar', label: 'Schedule', icon: Calendar },
    { href: '/resident/unit', label: 'My Unit', icon: Building2 },
    { href: '/resident/maintenance', label: 'Requests', icon: Wrench },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Top bar */}
      <header className='bg-[#08144800] border-b border-gray-200 sticky top-0 z-40' style={{ backgroundColor: '#081448' }}>
        <div className='max-w-2xl mx-auto px-4 h-14 flex items-center justify-between'>
          <span className='text-white font-bold text-lg tracking-tight'>Diligence</span>
          <Button
            variant='ghost'
            size='icon'
            className='text-white hover:bg-white/10'
            onClick={handleLogout}
          >
            <LogOut className='h-5 w-5' />
          </Button>
        </div>
      </header>

      {/* Page content */}
      <main className='max-w-2xl mx-auto pb-24'>
        {children}
      </main>

      {/* Bottom nav */}
      <nav className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40'>
        <div className='max-w-2xl mx-auto flex'>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : ''}`} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
