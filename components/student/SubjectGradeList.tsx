"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SubjectGradeListProps {
  subjects: any[];
}

export default function SubjectGradeList({ subjects }: SubjectGradeListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter subjects based on search term
  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to get grade letter based on marks
  const getGradeLetter = (marks: number) => {
    if (marks >= 90) return "A+";
    if (marks >= 80) return "A";
    if (marks >= 70) return "B+";
    if (marks >= 60) return "B";
    if (marks >= 50) return "C";
    if (marks >= 40) return "D";
    return "F";
  };

  // Helper function to get badge variant based on grade
  const getBadgeVariant = (grade: string): "default" | "destructive" | "outline" | "success" | "warning" => {
    switch (grade) {
      case "A+":
      case "A":
        return "success";
      case "B+":
      case "B":
        return "default";
      case "C":
        return "outline"; // Changed from "secondary" to a supported variant
      case "D":
        return "warning";
      default:
        return "destructive";
    }
  };

  // Prepare chart data
  const chartData = {
    labels: subjects.map(subject => subject.code),
    datasets: [
      {
        label: 'Sessional',
        data: subjects.map(subject => subject.internalMarks?.sessionalMark || 0),
        backgroundColor: 'rgba(79, 70, 229, 0.6)',
      },
      {
        label: 'Attendance',
        data: subjects.map(subject => subject.internalMarks?.attendanceMark || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
      },
      {
        label: 'Total',
        data: subjects.map(subject => subject.internalMarks?.totalMark || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <h3 className="text-lg font-medium">
          {subjects.length} Subjects - {subjects[0]?.section?.name || ""}
        </h3>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-4"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="w-[100px] text-center">Obtained</TableHead>
              <TableHead className="w-[100px] text-center">Attendance</TableHead>
              <TableHead className="w-[100px] text-center">Total</TableHead>
              <TableHead className="w-[80px] text-center">Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map((subject) => {
                const totalMark = subject.internalMarks?.totalMark || 0;
                const gradeLetter = getGradeLetter(totalMark);
                
                return (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.code}</TableCell>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell className="text-center">
                      {subject.internalMarks?.sessionalMark || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {subject.internalMarks?.attendanceMark || "-"}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {totalMark || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getBadgeVariant(gradeLetter)}>{gradeLetter}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No subjects found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Visualization */}
      
    </div>
  );
}
