interface ExecutiveSummaryProps {
    data:{
      summary: string;
      riskLevel: string;
    }
}

const ExecutiveSummary = ({data}:ExecutiveSummaryProps) => {
  return (
    <div className="col-span-2 md:col-span-3 lg:col-span-4 min-h-[150px] flex flex-col items-start justify-start bg-white rounded shadow-md p-4">
      <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
      <div className="flex flex-row items-center justify-between gap-4">
        <p className="text-md text-black basis-3/4">
          {data.summary}
        </p>
        <div className=" basis-1/4 flex flex-col items-center justify-center">
          <div className={`${data.riskLevel === 'HIGH' ? 'bg-[#D45F5F]' : data.riskLevel === 'MEDIUM' || 'MEDIUM-HIGH' ? 'bg-[#E69244]' : 'bg-[#6DBDAD]'} text-lg text-white font-bold p-2 px-4 rounded-full border-1 border-red-600`}>
            {data.riskLevel}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;