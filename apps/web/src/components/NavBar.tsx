'use client';

import Link from 'next/link';
import { Home, Compass, Route, Users, User } from 'lucide-react';

export default function NavBar() {
  const navItems = [
    { href: '/', icon: Home, label: '首页' },
    { href: '/explore', icon: Compass, label: '探索' },
    { href: '/trip', icon: Route, label: '行程' },
    { href: '/community', icon: Users, label: '社区' },
    { href: '/profile', icon: User, label: '我的' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


