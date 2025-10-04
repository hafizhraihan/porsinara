'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, Activity } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/admin', label: 'Admin Panel', icon: Settings },
  ];

  return (
    <nav className="bg-white shadow-sm border-b" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
               <img
                 src="https://student.binus.ac.id/malang/wp-content/uploads/sites/3/2022/08/logo-student.png"
                 alt="BINUS University Logo"
                 width={200}
                 height={100}
                 className="object-contain"
                 style={{ color: 'transparent' }}
                 suppressHydrationWarning
               />
               <span className="text-gray-400 mt-4 text-3xl">|</span>
               <span className="text-xl font-bold text-gray-900 mt-7">PORSINARA</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  suppressHydrationWarning
                >
                  <Icon className="w-4 h-4" suppressHydrationWarning />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            <div className="flex items-center space-x-2 text-red-600" suppressHydrationWarning>
              <div className="relative">
                <Activity className="w-4 h-4 live-pulse" suppressHydrationWarning />
                <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-20"></div>
              </div>
              <span className="text-sm font-medium live-pulse">LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
