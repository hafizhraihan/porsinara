'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, Shield, Users, Settings } from 'lucide-react';
import { useToast } from '@/components/ToastContainer';

interface AdminUser {
  id: string;
  username: string;
  role: 'SUP' | 'SPV' | 'STF';
  competition: string | null;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    // Skip authentication check if we're on the login page
    if (typeof window !== 'undefined' && (window.location.pathname === '/admin/login' || window.location.pathname.startsWith('/admin/login/'))) {
      setIsAuthenticated(false);
      return;
    }

    // Check if user is logged in
    const checkAuth = () => {
      const loggedIn = sessionStorage.getItem('adminLoggedIn');
      const userData = sessionStorage.getItem('adminUser');
      
      console.log('Checking auth - loggedIn:', loggedIn, 'userData:', userData);
      
      if (loggedIn === 'true' && userData) {
        try {
          const user = JSON.parse(userData);
          console.log('Setting authenticated user:', user);
          setIsAuthenticated(true);
          setAdminUser(user);
        } catch (error) {
          console.error('Error parsing admin user data:', error);
          sessionStorage.removeItem('adminLoggedIn');
          sessionStorage.removeItem('adminUser');
          setIsAuthenticated(false);
          if (typeof window !== 'undefined') {
            window.location.href = '/admin/login';
          }
        }
      } else {
        console.log('No valid session found, redirecting to login');
        setIsAuthenticated(false);
        if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      }
    };

    checkAuth();

    // Listen for storage changes to update when user changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminLoggedIn' || e.key === 'adminUser') {
        console.log('Storage change detected:', e.key);
        checkAuth();
      }
    };

    // Handle custom events (for same-tab changes)
    const handleCustomStorageChange = () => {
      console.log('Custom session change event detected, rechecking auth');
      // Force a small delay to ensure session storage is updated
      setTimeout(() => {
        checkAuth();
      }, 100);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('adminSessionChanged', handleCustomStorageChange);
      
      // Also listen for focus events to check session on tab focus
      const handleFocus = () => {
        console.log('Window focus detected, checking auth');
        checkAuth();
      };
      
      window.addEventListener('focus', handleFocus);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('adminSessionChanged', handleCustomStorageChange);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [router]);

  const handleLogout = () => {
    // Clear session data
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminUser');
    
    // Show logout toast
    addToast({
      type: 'success',
      title: 'Logged Out',
      message: 'You have been successfully logged out.',
      duration: 2000
    });
    
    // Immediate redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'SUP':
        return { name: 'Super User', color: 'text-red-600', icon: Shield };
      case 'SPV':
        return { name: 'Supervisor', color: 'text-yellow-600', icon: Users };
      case 'STF':
        return { name: 'Staff', color: 'text-green-600', icon: Settings };
      default:
        return { name: 'Unknown', color: 'text-gray-600', icon: Settings };
    }
  };

  const getCompetitionName = (competition: string | null) => {
    if (!competition) return 'All Competitions';
    const competitionMap: { [key: string]: string } = {
      'basketball-putra': 'Basketball Putra',
      'basketball-putri': 'Basketball Putri',
      'badminton-putra': 'Badminton Putra',
      'badminton-putri': 'Badminton Putri',
      'badminton-mixed': 'Badminton Mixed',
      'band': 'Band',
      'dance': 'Dance',
      'esports': 'Esports',
      'futsal': 'Futsal',
      'volleyball': 'Volleyball'
    };
    return competitionMap[competition] || competition;
  };

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (isAuthenticated === false) {
    // If we're on the login page, show the children (login form)
    if (typeof window !== 'undefined' && (window.location.pathname === '/admin/login' || window.location.pathname.startsWith('/admin/login/'))) {
      return <>{children}</>;
    }
    return null; // Will redirect to login
  }

  // Show admin content if authenticated
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  const roleInfo = getRoleInfo(adminUser.role);
  const RoleIcon = roleInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
              {adminUser && (
                <div className="flex items-center space-x-2 text-sm">
                  <RoleIcon className="w-4 h-4" />
                  <span className={`font-medium ${roleInfo.color}`}>
                    {roleInfo.name}
                  </span>
                  {adminUser.competition && (
                    <span className="text-gray-500">
                      • {adminUser.competition.includes(',') 
                        ? adminUser.competition.split(',').map(id => getCompetitionName(id.trim())).join(', ')
                        : getCompetitionName(adminUser.competition)
                      }
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {adminUser?.username}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 font-medium transition-colors rounded-md"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
