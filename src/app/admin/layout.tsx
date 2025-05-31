'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/common/Navbar';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Use useMemo to prepare static data and currentUser for Navbar
  const navbarCurrentUser = useMemo(() => {
    if (!user) return null;
    return {
      username: user.username,
      userClass: user.userClass,
      userId: user.userId,
      profilePic: user.profilePic || undefined
    };
  }, [user]);

  const navbarData = useMemo(() => ({
    lastUpdated: new Date().toLocaleString()
  }), []);

  // Check if user is authenticated and has admin/superuser rights
  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login if not authenticated
      router.push('/auth/login');
    } else if (!isLoading && user && user.userClass !== 'superuser') {
      // Redirect to homepage if not a superuser
      router.push('/');
    }
  }, [isLoading, user, router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  
  // If user is not authenticated or not a superuser, return nothing (will be redirected)
  if (!user || user.userClass !== 'superuser') {
    return null;
  }

  // Admin layout with navbar
  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="sticky top-0 z-10">
        <Navbar 
          currentUser={navbarCurrentUser}
          data={navbarData}
        />
      </header>
      <main className="p-4 max-w-screen-xl mx-auto">
        {children}
      </main>
    </div>
  );
}
