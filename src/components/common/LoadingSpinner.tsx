export default function LoadingSpinner() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#253A5C]"></div>
    </div>
  );
}