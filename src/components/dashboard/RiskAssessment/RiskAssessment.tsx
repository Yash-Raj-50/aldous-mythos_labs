import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface RiskAssessmentProps {
  data: {
    "riskLevel": string;
    "riskFactors": string[];
  }
}

const RiskAssessment = ({data}: RiskAssessmentProps) => {

  // Helper function to determine risk level index for visualization
  const getRiskLevelIndex = (level: string) => {
    switch(level) {
      case "HIGH": return 3;
      case "MEDIUM-HIGH": return 2;
      case "MEDIUM": return 1;
      case "LOW": return 0;
      default: return 0;
    }
  };

  const riskLevelIndex = getRiskLevelIndex(data.riskLevel);

  return (
    <div className="col-span-2 min-h-[300px] flex flex-col items-start justify-start bg-white rounded shadow-md p-4">
      <h3 className="text-lg font-semibold mb-2">Risk Assessment</h3>
      <div className="flex flex-col items-center justify-around grow w-full gap-2 py-2">
        {/* Risk Level Visualization with Arrow */}
        <div className="w-full flex flex-row items-center justify-around gap-0 relative">
          {/* Arrow indicator positioned above the matching color block */}
          <div className="absolute top-[-30px] left-0 w-full flex justify-around">
            <div style={{ 
              position: 'absolute', 
              left: `${riskLevelIndex * 25 + 12.5}%`,
              transform: 'translateX(-50%)'
            }}>
              <ArrowDropDownIcon style={{ fontSize: 40, color: 'black' }} />
            </div>
          </div>
          
          <div className="h-16 basis-1/4 bg-[#6DBDAD] flex flex-col items-center justify-center rounded-full">
            {riskLevelIndex === 0 && <div className="bg-white text-2xl font-bold h-16 w-16 flex flex-col items-center justify-center rounded-full border-4 border-black">⚠️</div>}
          </div>
          <div className="h-16 basis-1/4 bg-[#85B5B1] flex flex-col items-center justify-center">
            {riskLevelIndex === 1 && <div className="bg-white text-2xl font-bold h-16 w-16 flex flex-col items-center justify-center rounded-full border-4 border-black">⚠️</div>}
          </div>
          <div className="h-16 basis-1/4 bg-[#E39444] flex flex-col items-center justify-center">
            {riskLevelIndex === 2 && <div className="bg-white text-2xl font-bold h-16 w-16 flex flex-col items-center justify-center rounded-full border-4 border-black">⚠️</div>}
          </div>
          <div className="h-16 basis-1/4 bg-[#D2605E] flex flex-col items-center justify-center rounded-full">
            {riskLevelIndex === 3 && <div className="bg-white text-2xl font-bold h-16 w-16 flex flex-col items-center justify-center rounded-full border-4 border-black">⚠️</div>}
          </div>
        </div>
        
        {/* Risk Level Labels */}
        <div className="w-full grow text-sm flex flex-row items-start justify-around gap-0">
          <div className="basis-1/4 flex flex-col items-center justify-start">Low</div>
          <div className="basis-1/4 flex flex-col items-center justify-start">Medium</div>
          <div className="basis-1/4 flex flex-col items-center justify-start">Medium-High</div>
          <div className="basis-1/4 flex flex-col items-center justify-start">High</div>
        </div>
        
        {/* Risk Factors */}
        <div className="p-4 rounded w-full flex flex-col gap-1.5">
          <div className="text-sm font-bold">Risk Factors:</div>
          {data.riskFactors.map((factor, index) => (
            <p className="text-sm font-medium" key={index}>• {factor}</p>
          ))}
        </div>
        
      </div>
    </div>
  );
};

export default RiskAssessment;