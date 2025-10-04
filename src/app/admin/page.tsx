'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.push('/admin/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4"></Loader2>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}