'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateUser, logoutUser, getCurrentUser } from '@/actions/auth';

export interface User {
  username: string;
  userId: string;
  userClass: string;
  role?: string; // Added to match auth.ts
  profilePic?: string; // Optional field for Navbar compatibility
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing user on mount with proper cleanup
  useEffect(() => {
    let isMounted = true; // Track if component is still mounted
    
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        
        // Only update state if component is still mounted
        if (!isMounted) return;
        
        // userData will already have username, userId, userClass, and role
        // but we need to make sure it's correctly typed as our User interface
        if (userData) {
          // Data is already serialized from server action
          const userWithDefaults: User = {
            username: userData.username,
            userId: userData.userId,
            userClass: userData.userClass,
            role: userData.role,
          };
          
          // Add profilePic if it exists in the userData (though it may not be in the token)
          if ('profilePic' in userData && userData.profilePic) {
            userWithDefaults.profilePic = userData.profilePic as string;
          }
          
          setUser(userWithDefaults);
        } else {
          setUser(null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    checkAuth();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await authenticateUser(username, password);
      
      if (result && 'success' in result && result.success) {
        // Type assertion since we know this is the success case
        const successResult = result as { success: true; username: string; userId: string; userClass: string; role?: string };
        setUser({ 
          username: successResult.username ?? 'defaultUsername',
          userId: successResult.userId ?? '',
          userClass: successResult.userClass ?? 'client',
          role: successResult.role,
          // profilePic is not returned from auth but we include it in the User interface for Navbar compatibility
        });
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      router.push('/auth/login');
    } catch {
      // Silently handle logout errors
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}