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
import { Progress } from "@/components/ui/progress";
import { Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AssessmentGradeListProps {
  assessments: any[];
}

export default function AssessmentGradeList({ assessments }: AssessmentGradeListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  // Extract unique assessment types
  const assessmentTypes = ["ALL", ...Array.from(new Set(assessments.map(a => a.type)))];

  // Filter assessments based on search term and type
  const filteredAssessments = assessments.filter(
    (assessment) => (
      (assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       assessment.subject?.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterType === "ALL" || assessment.type === filterType)
    )
  );

  // Helper function to get color based on performance percentage
  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-blue-500";
    if (percentage >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Calculate performance statistics
  const calculateStats = () => {
    if (assessments.length === 0) return { avg: 0, best: 0, count: 0 };
    
    let totalPercentage = 0;
    let bestPercentage = 0;
    
    assessments.forEach(assessment => {
      const percentage = assessment.mark?.marksObtained 
        ? (assessment.mark.marksObtained / assessment.maxMarks) * 100
        : 0;
      
      totalPercentage += percentage;
      if (percentage > bestPercentage) bestPercentage = percentage;
    });
    
    return {
      avg: totalPercentage / assessments.length,
      best: bestPercentage,
      count: assessments.length
    };
  };
  
  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Average Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avg.toFixed(1)}%</div>
            <Progress className="h-2 mt-2" value={stats.avg} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Best Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.best.toFixed(1)}%</div>
            <Progress className="h-2 mt-2 bg-green-100 [&>div]:bg-green-500" value={stats.best} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.count}</div>
            <div className="text-sm text-gray-500 mt-1">Across all subjects</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assessments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-4"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {assessmentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === "ALL" ? "All Types" : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assessment</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-[100px] text-center">Max Marks</TableHead>
              <TableHead className="w-[100px] text-center">Obtained</TableHead>
              <TableHead className="text-center">Performance</TableHead>
              <TableHead>Feedback</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssessments.length > 0 ? (
              filteredAssessments.map((assessment) => {
                const marksObtained = assessment.mark?.marksObtained ?? null;
                const percentage = marksObtained !== null 
                  ? (marksObtained / assessment.maxMarks) * 100 
                  : null;
                
                return (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{assessment.title}</TableCell>
                    <TableCell>{assessment.subject?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{assessment.type}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{assessment.maxMarks}</TableCell>
                    <TableCell className="text-center">
                      {marksObtained !== null ? marksObtained : "-"}
                    </TableCell>
                    <TableCell>
                      {percentage !== null ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${getPerformanceColor(percentage)}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Not graded</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {assessment.mark?.feedback || "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No assessments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
