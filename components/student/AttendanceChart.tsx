"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

interface AttendanceSummary {
  courseName: string;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

type AttendanceChartProps = {
  data: AttendanceSummary[];
};

export default function AttendanceChart({ data }: AttendanceChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    // Destroy previous chart instance if exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: data.map(item => item.courseName),
          datasets: [
            {
              label: "Present",
              data: data.map(item => item.present),
              backgroundColor: "rgba(34, 197, 94, 0.5)",
              borderColor: "rgb(34, 197, 94)",
              borderWidth: 1
            },
            {
              label: "Late",
              data: data.map(item => item.late),
              backgroundColor: "rgba(234, 179, 8, 0.5)",
              borderColor: "rgb(234, 179, 8)",
              borderWidth: 1
            },
            {
              label: "Absent",
              data: data.map(item => item.absent),
              backgroundColor: "rgba(239, 68, 68, 0.5)",
              borderColor: "rgb(239, 68, 68)",
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              stacked: true,
            },
            y: {
              stacked: true,
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          },
          plugins: {
            tooltip: {
              mode: "index",
              intersect: false
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
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No attendance data available.
      </div>
    );
  }

  return (
    <div>
      <canvas ref={chartRef} />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.map(item => (
          <div key={item.courseName} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium">{item.courseName}</div>
            <div className="text-right">
              <div 
                className={`text-sm font-bold ${
                  item.percentage >= 75 ? "text-green-600" :
                  item.percentage >= 65 ? "text-yellow-600" : 
                  "text-red-600"
                }`}
              >
                {item.percentage}%
              </div>
              <div className="text-xs text-gray-500">attendance</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
