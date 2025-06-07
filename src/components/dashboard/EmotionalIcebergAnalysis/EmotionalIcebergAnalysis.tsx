import React, { useState } from 'react';

interface EmotionalIcebergAnalysisProps {
  data?: {
    emotion: string;
    strength: string;
    underlyingDrivers: string[];
  }[] | null;
}

const EmotionalIcebergAnalysis = ({data}:EmotionalIcebergAnalysisProps) => {
  // Safe data access with default values
  const safeData = data || [
    {
      emotion: "No analysis available",
      strength: "LOW",
      underlyingDrivers: ["Analysis pending - no data available yet"]
    }
  ];
  
  // Track which driver is being hovered for tooltip
  const [hoveredDriver, setHoveredDriver] = useState<{index: number, subIndex: number} | null>(null);
  
  // Get iceberg color based on strength
  const getColor = (strength: string) => {
    switch(strength) {
      case 'HIGH': return '#D55E60'; // Red for high strength
      case 'MEDIUM': return '#E39444'; // Orange for medium
      case 'LOW': return '#4C6EF5'; // Blue for low
      default: return '#4C6EF5';
    }
  };
  
  return (
    <div className="col-span-2 min-h-[300px] flex flex-col items-start justify-start bg-white rounded shadow-md p-4">
      <h3 className="text-lg font-semibold mb-2">Emotional Iceberg Analysis</h3>
      <div className="h-full w-full">
        {/* Ocean surface with scrollable content */}
        <div className="relative w-full h-[220px] mt-4">
          {/* Surface label */}
          <div className="absolute top-[60px] left-2 z-10 text-sm font-semibold text-[#6F7D95]">Surface</div>
          
          {/* Surface line - now dotted */}
          <div className="absolute top-[80px] left-0 w-full h-[2px] z-10" 
               style={{ 
                 background: 'repeating-linear-gradient(to right, #6F7D95, #6F7D95 4px, transparent 4px, transparent 8px)'
               }}></div>
          
          {/* Ocean water */}
          <div className="absolute top-[82px] left-0 w-full h-[138px] bg-[#EEF0F5]"></div>
          
          {/* Tooltip for truncated text */}
          {hoveredDriver !== null && (
            <div 
              className="absolute z-20 bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg max-w-xs"
              style={{ 
                top: `${hoveredDriver.subIndex * 20 + 115}px`, 
                left: `${hoveredDriver.index * 200 + 110}px`,
                transform: 'translateX(-50%)'
              }}
            >
              {safeData[hoveredDriver.index]?.underlyingDrivers[hoveredDriver.subIndex]}
            </div>
          )}
          
          {/* Scrollable icebergs container */}
          <div className="absolute top-0 left-0 right-0 bottom-0 overflow-x-auto">
            <div 
              className="relative h-full" 
              style={{ 
                width: safeData.length > 3 ? `${safeData.length * 200}px` : '100%',
                minWidth: '100%'
              }}
            >
              {/* Icebergs */}
              {safeData.map((item, index) => {
                const color = getColor(item.strength);
                
                // Determine height and dimensions based on strength
                let aboveHeight, belowHeight, topWidth, bottomWidth;
                
                switch(item.strength) {
                  case 'HIGH':
                    aboveHeight = 70;
                    belowHeight = 110;
                    topWidth = 60;
                    bottomWidth = 120;
                    break;
                  case 'MEDIUM':
                    aboveHeight = 50;
                    belowHeight = 90;
                    topWidth = 50;
                    bottomWidth = 100;
                    break;
                  case 'LOW':
                  default:
                    aboveHeight = 30;
                    belowHeight = 70;
                    topWidth = 40;
                    bottomWidth = 80;
                    break;
                }
                
                // Calculate path coordinates
                const center = 110;
                const surfaceLine = 80;
                
                // Above water coordinates
                const topTriangleLeft = center - topWidth/2;
                const topTriangleRight = center + topWidth/2;
                const topTriangleTop = surfaceLine - aboveHeight;
                
                // Below water coordinates
                const bottomTriangleLeft = center - topWidth/2;
                const bottomTriangleRight = center + topWidth/2;
                const bottomTriangleBottomLeft = center - bottomWidth/2;
                const bottomTriangleBottomRight = center + bottomWidth/2;
                const bottomTriangleBottom = surfaceLine + belowHeight;
                
                // Position icebergs with less spacing
                const leftPosition = `${(index * 200) + 60}px`;
                
                return (
                  <div key={index} className="absolute" style={{ left: leftPosition, top: '0px' }}>
                    {/* SVG Iceberg */}
                    <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
                      {/* Top part of iceberg (above water) */}
                      <path 
                        d={`M${topTriangleLeft} ${surfaceLine} L${center} ${topTriangleTop} L${topTriangleRight} ${surfaceLine} Z`} 
                        fill={color} 
                        style={{ transition: 'all 0.3s ease' }}
                      />
                      
                      {/* Bottom part of iceberg (below water) */}
                      <path 
                        d={`M${bottomTriangleLeft} ${surfaceLine} 
                           L${bottomTriangleBottomLeft} ${bottomTriangleBottom} 
                           L${bottomTriangleBottomRight} ${bottomTriangleBottom} 
                           L${bottomTriangleRight} ${surfaceLine} Z`} 
                        fill={color} 
                        fillOpacity="0.7"
                        style={{ transition: 'all 0.3s ease' }}
                      />
                      
                      {/* Emotion text (visible part) */}
                      <text 
                        x={center} 
                        y={surfaceLine - aboveHeight/2} 
                        textAnchor="middle" 
                        fill="black" 
                        fontSize="14" 
                        fontWeight="bold"
                        style={{ transition: 'all 0.3s ease' }}
                      >
                        {item.emotion}
                      </text>
                      
                      {/* Underlying drivers (hidden part) with tooltip support */}
                      {item.underlyingDrivers.map((driver, dIndex) => {
                        // Dynamic positioning based on how many drivers there are
                        const yPos = surfaceLine + 30 + (dIndex * 20);
                        // Only show if it fits
                        if (yPos < bottomTriangleBottom - 10) {
                          const isTruncated = driver.length > 20;
                          const displayText = isTruncated ? driver.substring(0, 18) + '...' : driver;
                          
                          return (
                            <g key={dIndex}>
                              <text 
                                x={center} 
                                y={yPos} 
                                textAnchor="middle" 
                                fill="#6F7D95" 
                                stroke="#444444"
                                strokeWidth="0.25"
                                strokeLinejoin="round"
                                fontSize="16"
                                style={{ transition: 'all 0.3s ease', cursor: isTruncated ? 'pointer' : 'default' }}
                                onMouseEnter={() => isTruncated && setHoveredDriver({index, subIndex: dIndex})}
                                onMouseLeave={() => setHoveredDriver(null)}
                              >
                                {displayText}
                              </text>
                              {/* Invisible wider hit area for better hover experience */}
                              {isTruncated && (
                                <rect 
                                  x={center - 100} 
                                  y={yPos - 10} 
                                  width="200" 
                                  height="20" 
                                  fill="transparent"
                                  onMouseEnter={() => setHoveredDriver({index, subIndex: dIndex})}
                                  onMouseLeave={() => setHoveredDriver(null)}
                                  style={{ cursor: 'pointer' }}
                                />
                              )}
                            </g>
                          );
                        }
                        return null;
                      })}
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionalIcebergAnalysis;