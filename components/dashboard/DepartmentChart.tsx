"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

type DepartmentChartProps = {
  studentData: Record<string, number>;
  facultyData: Record<string, number>;
};

export default function DepartmentChart({
  studentData,
  facultyData
}: DepartmentChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy previous chart instance if exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const departments = Array.from(
      new Set([...Object.keys(studentData), ...Object.keys(facultyData)])
    );

    const ctx = chartRef.current.getContext("2d");
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: departments,
          datasets: [
            {
              label: "Students",
              data: departments.map(dept => studentData[dept] || 0),
              backgroundColor: "rgba(59, 130, 246, 0.5)",
              borderColor: "rgb(59, 130, 246)",
              borderWidth: 1
            },
            {
              label: "Faculty",
              data: departments.map(dept => facultyData[dept] || 0),
              backgroundColor: "rgba(139, 92, 246, 0.5)",
              borderColor: "rgb(139, 92, 246)",
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "top"
            },
            tooltip: {
              mode: "index",
              intersect: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [studentData, facultyData]);

  return (
    <div>
      <canvas ref={chartRef} />
      {Object.keys(studentData).length === 0 && Object.keys(facultyData).length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No department data available
        </div>
      )}
    </div>
  );
}
