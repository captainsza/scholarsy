"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip as ChartTooltip, 
  Legend, 
  Filler,
  ChartOptions
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register the chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface GradeProgressChartProps {
  data: any[];
}

export default function GradeProgressChart({ data }: GradeProgressChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  
  // Extract labels (names) from data
  const labels = data.map(item => item.name);
  
  // Chart options
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Score (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time Period'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 10,
        boxPadding: 3,
        usePointStyle: true,
        callbacks: {
          labelTextColor: (context) => {
            return context.dataset.borderColor as string;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    }
  };
  
  // Line chart data
  const lineChartData = {
    labels,
    datasets: [
      {
        label: 'GPA (scaled)',
        data: data.map(item => item.gpa),
        borderColor: '#8884d8',
        backgroundColor: '#8884d8',
        fill: chartType === 'area',
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#8884d8',
      },
      {
        label: 'Average Mark',
        data: data.map(item => item.averageMark),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        fill: chartType === 'area',
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#4f46e5',
      },
      {
        label: 'Class Average',
        data: data.map(item => item.classAverage),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        fill: chartType === 'area',
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#22c55e',
      }
    ]
  };

  // Area chart data (same as line chart but with fill enabled)
  const areaChartData = {
    ...lineChartData,
    datasets: lineChartData.datasets.map(dataset => ({
      ...dataset,
      fill: true,
    }))
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setChartType(value as 'line' | 'area');
  };
  
  return (
    <Tabs defaultValue="line" onValueChange={handleTabChange}>
      <TabsList className="mb-4">
        <TabsTrigger value="line">Line Chart</TabsTrigger>
        <TabsTrigger value="area">Area Chart</TabsTrigger>
      </TabsList>
      
      <TabsContent value="line">
        <Card>
          <CardContent className="p-6">
            <div className="h-80 w-full">
              <Line 
                options={options} 
                data={lineChartData}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="area">
        <Card>
          <CardContent className="p-6">
            <div className="h-80 w-full">
              <Line 
                options={options}
                data={areaChartData}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}