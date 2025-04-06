'use client'

import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function withLoading<P extends object>(Component: React.ComponentType<P>) {
  return function WithLoadingComponent(props: P) {
    const { isLoading } = useAuth();
    
    if (isLoading) {
      return <LoadingSpinner />;
    }
    
    return <Component {...props} />;
  };
}

// Usage example:
// const HomePage = withLoading(HomeContent);
// export default HomePage;