interface KeyInflectionPointsProps {
  data?: {
    timestamp: string;
    quote: string;
    significance: string;
    type: string;
  }[] | null;
}

const KeyInflectionPoints = ({data}:KeyInflectionPointsProps) => {
  // Safe data access with default values
  const safeData = data || [
    {
      timestamp: "No date",
      quote: "Analysis pending - no data available yet",
      significance: "No analysis available",
      type: "UNKNOWN"
    }
  ];
  
  // Get color based on index position
  const getColor = (index: number, total: number) => {
    const colors = ["#4C6EF5", "#43A047", "#FB8C00", "#E53935"]; // blue, green, orange, red
    const position = Math.min(Math.floor(index / (total / colors.length)), colors.length - 1);
    return colors[position];
  };

  return (
    <div className="col-span-2 lg:col-span-4 min-h-[300px] flex flex-col items-start justify-start bg-white rounded shadow-md p-4">
      <h3 className="text-lg font-semibold mb-2">Key Inflection Points</h3>
      <div className="grow w-full flex flex-col items-center justify-start">
        {/* Timeline Container with Horizontal Scroll */}
        <div className="w-full overflow-x-auto">
          <div 
            className="relative" 
            style={{ 
              minWidth: '100%',
              width: safeData.length > 3 ? `${safeData.length * 250}px` : '100%',
              height: '250px'
            }}
          >
            {/* Timeline Line */}
            <div className="absolute top-[40px] left-0 w-full h-[3px] bg-gray-300"></div>
            
            {/* Timeline Points */}
            <div className="absolute top-0 left-0 w-full flex justify-around">
              {safeData.map((point, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center"
                  style={{ 
                    minWidth: '200px', 
                    maxWidth: '280px'
                  }}
                >
                  {/* Dot on timeline */}
                  <div 
                    className="w-5 h-5 rounded-full z-5"
                    style={{ 
                      backgroundColor: getColor(index, safeData.length),
                      marginTop: '34px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  ></div>
                  
                  {/* Connector Line */}
                  <div 
                    className="w-[1px] h-8"
                    style={{ backgroundColor: getColor(index, safeData.length) }}
                  ></div>
                  
                  {/* Info Box */}
                  <div 
                    className="p-3 rounded-lg shadow-md"
                    style={{ 
                      backgroundColor: `${getColor(index, safeData.length)}10`,
                      border: `1px solid ${getColor(index, safeData.length)}`,
                      maxWidth: '250px'
                    }}
                  >
                    <div className="text-xs font-medium" style={{ color: getColor(index, safeData.length) }}>
                      {point.timestamp}
                    </div>
                    <div className="text-sm font-bold mt-1">
                    &quot;{point.quote}&quot;
                    </div>
                    <div className="text-xs mt-1 text-gray-500">
                      {point.type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyInflectionPoints;