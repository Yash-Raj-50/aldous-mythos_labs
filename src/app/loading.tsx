const loading = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#253A5C] mx-auto"></div>
        <p className="mt-4 text-[#253A5C]">Loading user data...</p>
      </div>
    </div>
  );
};

export default loading;
