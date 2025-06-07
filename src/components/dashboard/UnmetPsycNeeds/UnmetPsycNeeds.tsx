interface UnmetPsycNeedsProps {
  data?: {
    need: string;
    quote: string;
    size: string;
    color: string;
  }[] | null;
}

const UnmetPsycNeeds = ({data}:UnmetPsycNeedsProps) => {
  // Safe data access with default values
  const safeData = data || [
    {
      need: "No analysis available",
      quote: "Analysis pending - no data available yet",
      size: "large",
      color: "gray"
    }
  ];

  // Helper function to determine col span based on size
  const getColSpan = (size: string) => {
    switch(size.toLowerCase()) {
      case "large": return "col-span-6";
      case "medium": return "col-span-4";
      case "small": return "col-span-3";
      default: return "col-span-3";
    }
  };
  // Helper function to determine background color based on color
  const getBgColor = (color: string) => {
    switch(color.toLowerCase()) {
      case "blue": return "bg-[#E9B176]";
      case "red": return "bg-[#DC8A8D]";
      case "orange": return "bg-[#E9B176]";
      case "yellow": return "bg-[#F8F9FB]";
      case "green": return "bg-[#6DBDAD]";
      case "teal": return "bg-[#A6CAC7]";
      case "purple": return "bg-[#A6CAC7]";
      case "pink": return "bg-[#E9B176]";
      case "brown": return "bg-[#E9B176]";
      case "gray": return "bg-[#F8F9FB]";
      default: return "bg-[#F8F9FB]";
    }
  };
  return (
    <div className="col-span-2 min-h-[300px] flex flex-col items-start justify-start bg-white rounded shadow-md p-4">
      <h3 className="text-lg font-semibold mb-2">Unmet Psychological Needs</h3>
      <div className="bg-[#F8F9FB] w-full h-full grid grid-cols-12 grid-flow-dense gap-1 p-4 overflow-y-scroll">
        {safeData.map((need, index) => (
          <div key={index} className={`${getColSpan(need.size)} ${getBgColor(need.color)} flex flex-col items-center justify-center min-h-[100px] text-white gap-2 p-2`}>
            <span className="text-sm max-w-full font-bold text-white">{need.need}</span>
            <span className="text-xs max-w-full font-semibold text-white">&quot;{need.quote}&quot;</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnmetPsycNeeds;