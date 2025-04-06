'use client'
import withLoading from "@/components/common/WithLoading";

function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#253A5C]">
      {children}
    </div>
  );
}

export default withLoading(AuthLayout);