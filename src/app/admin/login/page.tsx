'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ToastContainer';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: string;
  username: string;
  password: string;
  role: 'SUP' | 'SPV' | 'STF';
  competition: string | null;
}

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Query admin_users table
      const { data: adminUsers, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !adminUsers) {
        addToast({
          type: 'error',
          title: 'Login Failed',
          message: 'Invalid username or password',
          duration: 4000
        });
        return;
      }

      // Store admin session data
      sessionStorage.setItem('adminLoggedIn', 'true');
      sessionStorage.setItem('adminUser', JSON.stringify({
        id: adminUsers.id,
        username: adminUsers.username,
        role: adminUsers.role,
        competition: adminUsers.competition
      }));

      console.log('Login successful, session data stored:', {
        id: adminUsers.id,
        username: adminUsers.username,
        role: adminUsers.role,
        competition: adminUsers.competition
      });

      addToast({
        type: 'success',
        title: 'Login Successful',
        message: `Welcome, ${adminUsers.username}!`,
        duration: 3000
      });

      // Dispatch custom event to notify other components of session change
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('adminSessionChanged'));
      }

      // Redirect to admin dashboard
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      addToast({
        type: 'error',
        title: 'Login Error',
        message: 'An error occurred during login. Please try again.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'SUP': return 'Super User - Full access to all competitions';
      case 'SPV': return 'Supervisor - Full access to assigned competition';
      case 'STF': return 'Staff - Limited access to assigned competition';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-600">PORSINARA Management System</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Role Information */}
          <div className="mt-8 space-y-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Role Information:</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span><strong>SUP:</strong> {getRoleDescription('SUP')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span><strong>SPV:</strong> {getRoleDescription('SPV')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span><strong>STF:</strong> {getRoleDescription('STF')}</span>
              </div>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Super User:</strong> sdc1 / sdc567</p>
              <p><strong>Basketball Supervisor:</strong> basketspv1 / basketspv567</p>
              <p><strong>Basketball Staff:</strong> basket1 / basket567</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            PORSINARA {new Date().getFullYear()} - BINUS University
          </p>
        </div>
      </div>
    </div>
  );
}
