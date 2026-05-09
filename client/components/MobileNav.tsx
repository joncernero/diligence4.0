'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderKanban, Calendar, FileText } from 'lucide-react';

const navItems = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className='fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 flex md:hidden'>
      {navItems.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors ${
              isActive
                ? 'text-primary'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <item.icon
              className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-400'}`}
            />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
