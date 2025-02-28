"use client";

import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

type AttendanceData = Record<string, {
  present: number;
  absent: number;
  late: number;
}>;

type AttendanceSummaryProps = {
  data: AttendanceData;
};

export default function AttendanceSummary({ data }: AttendanceSummaryProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy previous chart instance if exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const courses = Object.keys(data);
    
    if (courses.length === 0) return;

    const ctx = chartRef.current.getContext("2d");
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: courses,
          datasets: [
            {
              label: "Present",
              data: courses.map(course => data[course].present),
              backgroundColor: "rgba(34, 197, 94, 0.5)",
              borderColor: "rgb(34, 197, 94)",
              borderWidth: 1
            },
            {
              label: "Absent",
              data: courses.map(course => data[course].absent),
              backgroundColor: "rgba(239, 68, 68, 0.5)",
              borderColor: "rgb(239, 68, 68)",
              borderWidth: 1
            },
            {
              label: "Late",
              data: courses.map(course => data[course].late),
              backgroundColor: "rgba(234, 179, 8, 0.5)",
              borderColor: "rgb(234, 179, 8)",
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

  if (Object.keys(data).length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No attendance data available.
      </div>
    );
  }

  return (
    <div>
      <canvas ref={chartRef} />
    </div>
  );
}
