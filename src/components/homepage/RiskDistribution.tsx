'use client';
import { useEffect, useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Profile, Analysis } from '@/types/databaseTypes'; // Import types

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RiskDistributionProps {
  profiles: Profile[]; // Use Profile[]
  analyses: Record<string, Analysis | null>; // Use Record<string, Analysis | null>
}

const RiskDistribution = ({ profiles, analyses }: RiskDistributionProps) => {
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
      borderRadius: number;
    }>;
  } | null>(null);

  useEffect(() => {
    // Count risk levels - add MEDIUM-HIGH
    const riskCounts = {
      HIGH: 0,
      'MEDIUM-HIGH': 0,
      MEDIUM: 0,
      LOW: 0
    };

    // Count occurrences of each risk level based on analyses
    profiles.forEach(profile => {
      if (profile.id) {
        const analysis = analyses[profile.id];
        if (analysis && analysis.completeAnalysis) {
          // Example: Determine riskLevel from analysis.completeAnalysis
          // This logic needs to be robust and match how risk is determined elsewhere
          let riskLevel = "LOW"; // Default
          if (analysis.completeAnalysis.someFlag === 'high') riskLevel = "HIGH";
          else if (analysis.completeAnalysis.someFlag === 'medium-high') riskLevel = "MEDIUM-HIGH";
          else if (analysis.completeAnalysis.someFlag === 'medium') riskLevel = "MEDIUM";
          
          if (riskCounts.hasOwnProperty(riskLevel)) {
            riskCounts[riskLevel as keyof typeof riskCounts]++;
          }
        }
      }
    });

    // Prepare the chart data - include MEDIUM-HIGH in the correct order
    setChartData({
      labels: ['HIGH', 'MEDIUM-HIGH', 'MEDIUM', 'LOW'],
      datasets: [
        {
          label: 'Number of Users',
          data: [riskCounts.HIGH, riskCounts['MEDIUM-HIGH'], riskCounts.MEDIUM, riskCounts.LOW],
          backgroundColor: [
            '#D45F5F',  // Red for HIGH
            '#E05A3A',  // Reddish-Orange for MEDIUM-HIGH
            '#E69244',  // Orange for MEDIUM
            '#6DBDAD',  // Teal for LOW
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(224, 90, 58)',
            'rgb(255, 159, 64)',
            'rgb(75, 192, 192)',
          ],
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    });
  }, [profiles, analyses]); // Update dependencies

  // Find the maximum count to set the appropriate scale
  const calculateMaxCount = () => {
    if (!profiles || !analyses) return 0;
    const counts = {
      HIGH: 0,
      'MEDIUM-HIGH': 0,
      MEDIUM: 0,
      LOW: 0
    };
    profiles.forEach(profile => {
      if (profile.id) {
        const analysis = analyses[profile.id];
        if (analysis && analysis.completeAnalysis) {
          let riskLevel = "LOW"; // Default
          if (analysis.completeAnalysis.someFlag === 'high') riskLevel = "HIGH";
          else if (analysis.completeAnalysis.someFlag === 'medium-high') riskLevel = "MEDIUM-HIGH";
          else if (analysis.completeAnalysis.someFlag === 'medium') riskLevel = "MEDIUM";

          if (counts.hasOwnProperty(riskLevel)) {
            counts[riskLevel as keyof typeof counts]++;
          }
        }
      }
    });
    return Math.max(counts.HIGH, counts['MEDIUM-HIGH'], counts.MEDIUM, counts.LOW);
  };
  
  const maxCount = calculateMaxCount();

  // Options for the chart - unchanged
  const options = {
    indexAxis: 'y' as const, // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend since we only have one dataset
      },
      tooltip: {
        callbacks: {
          label: function(context: { formattedValue: string }) {
            return `${context.formattedValue} Users`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        // Add right padding by setting a max value slightly higher than our data
        max: Math.ceil(maxCount * 1.2), // 20% extra space on the right
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          precision: 0, // Only show whole numbers
        },
        title: {
          display: false,
        }
      },
      y: {
        grid: {
          display: false, // Hide y-axis grid lines
        },
      }
    },
    layout: {
      padding: {
        right: 20, // Additional padding on the right
      }
    },
  };

  return (
    <div className="col-span-2 min-h-[300px] flex flex-col items-start justify-start bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-2">Risk Distribution</h3>
      <div className="w-full h-[250px] bg-gray-50 p-3 rounded">
        {chartData && <Bar data={chartData} options={options} />}
      </div>
    </div>
  );
};

export default RiskDistribution;