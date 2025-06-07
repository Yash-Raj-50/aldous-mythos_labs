interface RadStageAssessmentProps {
  data?: {
    "stage"?: string;
    "evidence"?: {
      "quote": string;
      "significance": string;
    }[];
    "explanation"?: string[];
  } | null;
}

const RadStageAssessment = ({data}:RadStageAssessmentProps) => {
  // Provide default values if data is undefined or incomplete
  const stage = data?.stage || "unknown";
  const explanation = data?.explanation || ["No assessment available"];
  
  return (
    <div className="col-span-2 min-h-[300px] flex flex-col items-start justify-start bg-white rounded shadow-md p-4">
      <h3 className="text-lg font-semibold mb-2">Radicalization Stage Assessment</h3>
      <div className="flex flex-col items-center justify-around grow w-full gap-2 py-2">
        <div className="w-full flex flex-row items-center justify-around gap-0">
          <div className="h-16 basis-1/4 bg-[#5790C1] flex flex-col items-center justify-center rounded-full">
            {stage.toLowerCase()==="curiosity" && <div className="bg-white font-bold h-16 w-16 flex flex-col items-center justify-center rounded-full border-4 border-[#C26166]">HERE</div>}
          </div>
          <div className="h-16 basis-1/4 bg-[#3A70AF] flex flex-col items-center justify-center">
            {stage.toLowerCase()==="sympathy" && <div className="bg-white font-bold h-16 w-16 flex flex-col items-center justify-center rounded-full border-4 border-[#C26166]">HERE</div>}
          </div>
          <div className="h-16 basis-1/4 bg-[#235197] flex flex-col items-center justify-center">
            {stage.toLowerCase()==="action-seeking" && <div className="bg-white font-bold h-16 w-16 flex flex-col items-center justify-center rounded-full border-4 border-[#C26166]">HERE</div>}
          </div>
          <div className="h-16 basis-1/4 bg-[#142F66] flex flex-col items-center justify-center rounded-full">
            {stage.toLowerCase()==="operational" && <div className="bg-white font-bold h-16 w-16 flex flex-col items-center justify-center rounded-full border-4 border-[#C26166]">HERE</div>}
          </div>
        </div>
        <div className="w-full grow text-sm flex flex-row items-start justify-around gap-0">
          <div className="basis-1/4 flex flex-col items-center justify-start">Curiosity</div>
          <div className="basis-1/4 flex flex-col items-center justify-start">Sympathy</div>
          <div className="basis-1/4 flex flex-col items-center justify-start">Action-Seeking</div>
          <div className="basis-1/4 flex flex-col items-center justify-start">Operational</div>
        </div>
        <div className="bg-[#F8F8F8] p-4 rounded w-full flex flex-col gap-1.5">
          <div className="text-sm font-bold">{stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase()} Stage:</div>
          {explanation.map((explanation, index) => (
            <p className="text-sm font-medium " key={index}>• {explanation}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RadStageAssessment;