interface RecommendedApproachesProps {
  data: {
    primaryStrategy: string[];
    specificTactics: string[];
    approachesToAvoid: string[];
  };
}

const RecommendedApproaches = ({data}:RecommendedApproachesProps) => {
  return (
    <div className="col-span-2 lg:col-span-4 min-h-[250px] flex flex-col items-start justify-start bg-white rounded shadow-md p-4">
      <h3 className="text-lg font-semibold mb-2">Recommended Approaches</h3>
      <div className="w-full h-full grid grid-cols-9 gap-2">
        <div className="col-span-9 lg:col-span-3 p-4 border-[#456183] bg-[#F2F7FE]  border rounded">
          <h4 className="mb-2 text-md text-[#456183] font-bold">Primary Strategy:</h4>
          <ul className="list-disc list-inside">
            {data.primaryStrategy.map((strategy, index) => (
              <li key={index} className="text-sm">{strategy}</li>
            ))}
          </ul>
        </div>
        <div className="col-span-9 lg:col-span-3 p-4 border-[#8AB2AD] bg-[#F4F9F7]  border rounded">
          <h4 className="mb-2 text-md text-[#8AB2AD] font-bold">Specific Tasks:</h4>
          <ul className="list-disc list-inside">
            {data.specificTactics.map((strategy, index) => (
              <li key={index} className="text-sm">{strategy}</li>
            ))}
          </ul>
        </div>
        <div className="col-span-9 lg:col-span-3 p-4 border-[#BD6163] bg-[#FCF3F3]  border rounded">
          <h4 className="mb-2 text-md text-[#BD6163] font-bold">Approaches to Avoid:</h4>
          <ul className="list-disc list-inside">
            {data.approachesToAvoid.map((strategy, index) => (
              <li key={index} className="text-sm">{strategy}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RecommendedApproaches;