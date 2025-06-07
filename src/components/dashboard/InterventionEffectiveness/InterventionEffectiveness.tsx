import { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

type EngagementLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface InterventionCategory {
  score: number; // 0-100
  assessment: string;
  isFocus?: boolean;
  isAvoid?: boolean;
}

interface EngagementDataPoint {
  timestamp: string; // MM/DD/YYYY HH:MM format
  level: EngagementLevel;
  event: string;
}

interface InterventionEffectivenessData {
  data?: {
    openQuestions?: InterventionCategory;
    addressingGrievances?: InterventionCategory;
    emotionalValidation?: InterventionCategory;
    alternativeNarratives?: InterventionCategory;
    directChallenges?: InterventionCategory;
    engagementTrend?: {
      dataPoints?: EngagementDataPoint[];
    };
  } | null;
}

const InterventionEffectiveness = ({ data }: InterventionEffectivenessData) => {
  const [animate, setAnimate] = useState(false);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Provide default values if data is undefined or incomplete
  const defaultCategory: InterventionCategory = { score: 50, assessment: "MIXED" };
  const interventionData = {
    openQuestions: data?.openQuestions || defaultCategory,
    addressingGrievances: data?.addressingGrievances || defaultCategory,
    emotionalValidation: data?.emotionalValidation || defaultCategory,
    alternativeNarratives: data?.alternativeNarratives || defaultCategory,
    directChallenges: data?.directChallenges || defaultCategory,
    engagementTrend: {
      dataPoints: data?.engagementTrend?.dataPoints || []
    }
  };

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score < 40) return "#D2605E"; // Red for low scores
    if (score < 70) return "#E39444"; // Orange for medium scores
    return "#6DBDAD"; // Green for high scores
  };

  // Animation effect on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (chartRef.current && interventionData.engagementTrend.dataPoints.length > 0) {
      // Convert engagement level to numeric values for plotting
      const convertLevelToValue = (level: EngagementLevel): number => {
        switch (level) {
          case 'LOW': return 0;
          case 'MEDIUM': return 1;
          case 'HIGH': return 2;
          default: return 0;
        }
      };

      // Format dates for x-axis
      const labels = interventionData.engagementTrend.dataPoints.map(dp => dp.timestamp);

      // Map engagement levels to numeric values for y-axis
      const values = interventionData.engagementTrend.dataPoints.map(dp => convertLevelToValue(dp.level));

      // Prepare events for tooltips
      const events = interventionData.engagementTrend.dataPoints.map(dp => dp.event);

      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');

      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Engagement Level',
              data: values,
              borderColor: '#3B82F6', // Blue line
              backgroundColor: 'rgba(59, 130, 246, 0.1)', // Light blue background
              borderWidth: 2,
              tension: 0.3, // Smooth curve
              pointBackgroundColor: '#3B82F6',
              pointBorderColor: '#fff',
              pointRadius: 4,
              pointHoverRadius: 6,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 1500, // Animation duration in ms
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Timestamp',
                  color: '#374151',
                },
                grid: {
                  color: 'rgba(107, 114, 128, 0.2)',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Engagement Level',
                  color: '#374151',
                },
                min: -0.5, // Give some space at the bottom
                max: 2.5,  // Give some space at the top
                ticks: {
                  callback: function (value) {
                    if (value === 0) return 'LOW';
                    if (value === 1) return 'MEDIUM';
                    if (value === 2) return 'HIGH';
                    return '';
                  }
                },
                grid: {
                  color: 'rgba(107, 114, 128, 0.2)',
                },
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const index = context.dataIndex;
                    const level = ['LOW', 'MEDIUM', 'HIGH'][context.raw as number];
                    const event = events[index];
                    return [`Level: ${level}`, `Event: ${event}`];
                  }
                }
              },
              legend: {
                display: false, // No legend as requested
              }
            },
          }
        });
      }
    }

    // Cleanup chart instance on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [interventionData.engagementTrend.dataPoints]);

  return (
    <div className="col-span-2 lg:col-span-4 min-h-[600px] lg:min-h-[500px] flex flex-col items-start justify-start bg-white rounded shadow-md p-4 gap-4">
      <h3 className="text-lg font-semibold">Intervention Effectiveness</h3>
      <div className="flex flex-col grow w-full items-start gap-2">
        <div className="flex flex-col w-full items-start justify-between gap-3 mb-2">
          <h2 className="font-semibold">Response to Different Approaches:</h2>
          <div className="flex flex-row items-start gap-2 w-full text-sm font-medium">
            <span className="w-2/8 flex flex-col items-end px-4">Open Questions:</span>
            <span className="w-5/8">
              <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: animate ? `${interventionData.openQuestions.score}%` : '0%',
                    backgroundColor: getScoreColor(interventionData.openQuestions.score)
                  }}
                ></div>
              </div>
            </span>
            <span className="w-2/8">{interventionData.openQuestions.assessment}</span>
            <span className="w-1/8 flex flex-row justify-start">
              {interventionData.openQuestions.isFocus && <span className="text-blue-600 font-medium">✔️ FOCUS</span>}
              {interventionData.openQuestions.isAvoid && <span className="text-red-600 font-medium">⚠️ AVOID</span>}
            </span>
          </div>
          <div className="flex flex-row items-start gap-2 w-full text-sm font-medium">
            <span className="w-2/8 flex flex-col items-end px-4">Addressing Grievances:</span>
            <span className="w-5/8">
              <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: animate ? `${interventionData.addressingGrievances.score}%` : '0%',
                    backgroundColor: getScoreColor(interventionData.addressingGrievances.score)
                  }}
                ></div>
              </div>
            </span>
            <span className="w-2/8">{interventionData.addressingGrievances.assessment}</span>
            <span className="w-1/8 flex flex-row justify-start">
              {interventionData.addressingGrievances.isFocus && <span className="text-blue-600 font-medium">✔️ FOCUS</span>}
              {interventionData.addressingGrievances.isAvoid && <span className="text-red-600 font-medium">⚠️ AVOID</span>}
            </span>
          </div>
          <div className="flex flex-row items-start gap-2 w-full text-sm font-medium">
            <span className="w-2/8 flex flex-col items-end px-4">Emotional Validation:</span>
            <span className="w-5/8">
              <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: animate ? `${interventionData.emotionalValidation.score}%` : '0%',
                    backgroundColor: getScoreColor(interventionData.emotionalValidation.score)
                  }}
                ></div>
              </div>
            </span>
            <span className="w-2/8">{interventionData.emotionalValidation.assessment}</span>
            <span className="w-1/8 flex flex-row justify-start">
              {interventionData.emotionalValidation.isFocus && <span className="text-blue-600 font-medium">✔️ FOCUS</span>}
              {interventionData.emotionalValidation.isAvoid && <span className="text-red-600 font-medium">⚠️ AVOID</span>}
            </span>
          </div>
          <div className="flex flex-row items-start gap-2 w-full text-sm font-medium">
            <span className="w-2/8 flex flex-col items-end px-4">Alternative Narratives:</span>
            <span className="w-5/8">
              <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: animate ? `${interventionData.alternativeNarratives.score}%` : '0%',
                    backgroundColor: getScoreColor(interventionData.alternativeNarratives.score)
                  }}
                ></div>
              </div>
            </span>
            <span className="w-2/8">{interventionData.alternativeNarratives.assessment}</span>
            <span className="w-1/8 flex flex-row justify-start">
              {interventionData.alternativeNarratives.isFocus && <span className="text-blue-600 font-medium">✔️ FOCUS</span>}
              {interventionData.alternativeNarratives.isAvoid && <span className="text-red-600 font-medium">⚠️ AVOID</span>}
            </span>
          </div>
          <div className="flex flex-row items-start gap-2 w-full text-sm font-medium">
            <span className="w-2/8 flex flex-col items-end px-4">Direct Challenges:</span>
            <span className="w-5/8">
              <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: animate ? `${interventionData.directChallenges.score}%` : '0%',
                    backgroundColor: getScoreColor(interventionData.directChallenges.score)
                  }}
                ></div>
              </div>
            </span>
            <span className="w-2/8">{interventionData.directChallenges.assessment}</span>
            <span className="w-1/8 flex flex-row justify-start">
              {interventionData.directChallenges.isFocus && <span className="text-blue-600 font-medium">✔️ FOCUS</span>}
              {interventionData.directChallenges.isAvoid && <span className="text-red-600 font-medium">⚠️ AVOID</span>}
            </span>
          </div>
        </div>
        <div className="w-full flex flex-col items-start justify-between gap-2">
          <h2 className="font-semibold">Engagement Trend:</h2>
          <div className='grow w-full flex flex-col items-start px-8 justify-start'>
            <div className="w-full h-[250px] bg-gray-50 rounded p-2">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterventionEffectiveness;