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
  data: {
    userID: string;
    riskLevel: string;
    lastActive: string;
  }[];
}

const RiskDistribution = ({ data }: RiskDistributionProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    // Count risk levels - add MEDIUM-HIGH
    const riskCounts = {
      HIGH: 0,
      'MEDIUM-HIGH': 0,
      MEDIUM: 0,
      LOW: 0
    };

    // Count occurrences of each risk level
    data.forEach(item => {
      if (riskCounts.hasOwnProperty(item.riskLevel)) {
        riskCounts[item.riskLevel as keyof typeof riskCounts]++;
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
  }, [data]);

  // Find the maximum count to set the appropriate scale
  const maxCount = data ? Math.max(
    data.filter(item => item.riskLevel === 'HIGH').length,
    data.filter(item => item.riskLevel === 'MEDIUM-HIGH').length,
    data.filter(item => item.riskLevel === 'MEDIUM').length,
    data.filter(item => item.riskLevel === 'LOW').length
  ) : 0;

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function(context: any) {
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