'use client';

import Link from 'next/link';

export default function Navigation() {

  const navItems = [
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
               <span className="text-gray-400 mt-4 text-3xl font-thin">|</span>
               <span className="text-xl font-bold text-gray-900 mt-7">PORSINARA</span>
            </Link>
          </div>
          
        </div>
      </div>
    </nav>
  );
}
