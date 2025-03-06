'use client';

import React, { useMemo } from 'react';
import { format, formatDistance, isBefore, isAfter, addDays } from 'date-fns';
import { Milestone } from '@/types/milestone';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckIcon, ClockIcon, AlertCircleIcon, CheckCircle2, Clock, AlertCircle, CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface MilestoneTimelineProps {
  milestones: Milestone[];
  campaignStartDate?: Date;
  campaignEndDate?: Date;
  campaignGoalAmount?: number;
  totalFunded?: number;
  onMilestoneClick?: (milestone: Milestone, index: number) => void;
}

export default function MilestoneTimeline({ 
  milestones = [],
  campaignStartDate = new Date(),
  campaignEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
  campaignGoalAmount = 0,
  totalFunded = 0,
  onMilestoneClick
}: MilestoneTimelineProps) {
  // Calculate overall campaign progress
  const campaignProgress = useMemo(() => {
    if (campaignGoalAmount <= 0) return 0;
    return Math.min(Math.floor((totalFunded / campaignGoalAmount) * 100), 100);
  }, [totalFunded, campaignGoalAmount]);

  // Organize milestones by status
  const { completedMilestones, upcomingMilestones, overdueMilestones, inReviewMilestones } = useMemo(() => {
    const today = new Date();
    
    const completed: Milestone[] = [];
    const upcoming: Milestone[] = [];
    const overdue: Milestone[] = [];
    const inReview: Milestone[] = [];
    
    if (milestones && Array.isArray(milestones)) {
      milestones.forEach(milestone => {
        if (milestone.completed || milestone.isCompleted) {
          completed.push(milestone);
        } else if (milestone.isUnderReview) {
          inReview.push(milestone);
        } else if (milestone.dueDate) {
          if (isBefore(milestone.dueDate, today)) {
            overdue.push(milestone);
          } else {
            upcoming.push(milestone);
          }
        } else {
          // If no due date, consider it upcoming
          upcoming.push(milestone);
        }
      });
    }
    
    return { 
      completedMilestones: completed, 
      upcomingMilestones: upcoming, 
      overdueMilestones: overdue,
      inReviewMilestones: inReview
    };
  }, [milestones]);

  // Determine if a milestone is at risk (due within 7 days)
  const isMilestoneAtRisk = (milestone: Milestone) => {
    if (!milestone.dueDate) return false;
    const today = new Date();
    const sevenDaysFromNow = addDays(today, 7);
    return isAfter(sevenDaysFromNow, milestone.dueDate) && isBefore(today, milestone.dueDate);
  };

  // Calculate the visual position of a milestone on the timeline
  const getMilestonePosition = (milestone: Milestone, index: number) => {
    if (!milestone.dueDate) {
      // If no due date, position evenly across timeline
      const milestonesLength = Array.isArray(milestones) ? milestones.length : 0;
      return `${(index + 1) * (100 / (milestonesLength + 1))}%`;
    }
    
    // Calculate position based on due date relative to campaign start and end
    const campaignDuration = campaignEndDate.getTime() - campaignStartDate.getTime();
    const milestoneDuration = milestone.dueDate.getTime() - campaignStartDate.getTime();
    
    const position = (milestoneDuration / campaignDuration) * 100;
    return `${Math.min(Math.max(position, 0), 100)}%`;
  };

  // Get status badge for milestone
  const getMilestoneStatusBadge = (milestone: Milestone) => {
    if (!milestone) return null;
    
    if (milestone.completed || milestone.isCompleted) {
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
    } else if (milestone.isUnderReview) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Under Review</Badge>;
    } else if (milestone.dueDate && isBefore(milestone.dueDate, new Date())) {
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Overdue</Badge>;
    } else if (isMilestoneAtRisk(milestone)) {
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">At Risk</Badge>;
    } else {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Upcoming</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Campaign progress header */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Campaign Progress</h3>
          <span className="text-md font-medium">{campaignProgress}%</span>
        </div>
        <Progress value={campaignProgress} className="h-2" />
        <div className="flex justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>{format(campaignStartDate, 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>{format(campaignEndDate, 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="relative py-10">
        {/* Timeline line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 transform -translate-y-1/2"></div>
        
        {/* Show empty state if no milestones */}
        {(!milestones || !Array.isArray(milestones) || milestones.length === 0) && (
          <div className="text-center py-4 text-gray-500">
            No milestones available
          </div>
        )}
        
        {/* Milestone markers positioned along the timeline */}
        {Array.isArray(milestones) && milestones.map((milestone, index) => {
          const left = getMilestonePosition(milestone, index);
          const isCompleted = milestone.completed || milestone.isCompleted;
          const isReview = milestone.isUnderReview;
          const isAtRisk = isMilestoneAtRisk(milestone);
          const isOverdue = milestone.dueDate && isBefore(milestone.dueDate, new Date()) && !isCompleted && !isReview;
          
          return (
            <Tooltip key={milestone.id || index}>
              <TooltipTrigger asChild>
                <div 
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ left }}
                  onClick={() => onMilestoneClick?.(milestone, index)}
                >
                  <div 
                    className={cn(
                      "flex items-center justify-center rounded-full border-2 p-1 transition-colors",
                      isCompleted ? "bg-green-100 border-green-500 text-green-700" :
                      isReview ? "bg-yellow-100 border-yellow-500 text-yellow-700" :
                      isOverdue ? "bg-red-100 border-red-500 text-red-700" :
                      isAtRisk ? "bg-amber-100 border-amber-500 text-amber-700" :
                      "bg-blue-100 border-blue-500 text-blue-700"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : isReview ? (
                      <Clock className="h-5 w-5" />
                    ) : isOverdue ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1 max-w-xs">
                  <p className="font-medium">{milestone?.name}</p>
                  {milestone?.dueDate && (
                    <p className="text-xs">
                      Due: {format(milestone.dueDate, 'MMM d, yyyy')}
                      {(isOverdue || isAtRisk) && !isCompleted && (
                        <span className={isOverdue ? "text-red-500 ml-1" : "text-amber-500 ml-1"}>
                          ({isOverdue ? 'Overdue' : 'Due soon'})
                        </span>
                      )}
                    </p>
                  )}
                  <div className="flex items-center gap-1">
                    {getMilestoneStatusBadge(milestone)}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Milestone Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Completed</h4>
              <div className="flex items-center justify-center bg-green-100 w-8 h-8 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-green-700" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-2">{completedMilestones?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">In Review</h4>
              <div className="flex items-center justify-center bg-yellow-100 w-8 h-8 rounded-full">
                <Clock className="h-4 w-4 text-yellow-700" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-2">{inReviewMilestones?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Upcoming</h4>
              <div className="flex items-center justify-center bg-blue-100 w-8 h-8 rounded-full">
                <Clock className="h-4 w-4 text-blue-700" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-2">{upcomingMilestones?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Overdue</h4>
              <div className="flex items-center justify-center bg-red-100 w-8 h-8 rounded-full">
                <AlertCircle className="h-4 w-4 text-red-700" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-2">{overdueMilestones?.length || 0}</p>
            {overdueMilestones?.length > 0 && (
              <p className="text-xs text-red-600 mt-1">Requires immediate attention</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Milestone Detail List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Milestone Details</h3>
        
        {overdueMilestones.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-700 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> Overdue Milestones
            </h4>
            {overdueMilestones.map((milestone, index) => (
              <Card key={milestone.id || `overdue-${index}`} className="border-red-200">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{milestone.name}</h5>
                      {milestone.dueDate && (
                        <p className="text-sm text-red-600">
                          Due {format(milestone.dueDate, 'MMM d, yyyy')} ({formatDistance(milestone.dueDate, new Date())} ago)
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Overdue</Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => onMilestoneClick?.(milestone, milestones.indexOf(milestone))}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {inReviewMilestones.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-yellow-700 flex items-center gap-1">
              <Clock className="h-4 w-4" /> Milestones In Review
            </h4>
            {inReviewMilestones.map((milestone, index) => (
              <Card key={milestone.id || `review-${index}`} className="border-yellow-200">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{milestone.name}</h5>
                      <p className="text-sm text-gray-500">
                        Under review by contributors
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Under Review</Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => onMilestoneClick?.(milestone, milestones.indexOf(milestone))}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {upcomingMilestones.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-blue-700 flex items-center gap-1">
              <Clock className="h-4 w-4" /> Upcoming Milestones
            </h4>
            {upcomingMilestones.map((milestone, index) => {
              const isAtRisk = isMilestoneAtRisk(milestone);
              
              return (
                <Card key={milestone.id || `upcoming-${index}`} className={isAtRisk ? "border-amber-200" : "border-blue-200"}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">{milestone.name}</h5>
                        {milestone.dueDate && (
                          <p className={`text-sm ${isAtRisk ? "text-amber-600" : "text-gray-500"}`}>
                            Due {format(milestone.dueDate, 'MMM d, yyyy')}
                            {isAtRisk && " (Due soon)"}
                          </p>
                        )}
                      </div>
                      {isAtRisk ? (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">At Risk</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Upcoming</Badge>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => onMilestoneClick?.(milestone, milestones.indexOf(milestone))}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {completedMilestones.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-green-700 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Completed Milestones
            </h4>
            {completedMilestones.map((milestone, index) => (
              <Card key={milestone.id || `completed-${index}`} className="border-green-200">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{milestone.name}</h5>
                      {milestone.dueDate && (
                        <p className="text-sm text-gray-500">
                          Completed on {format(milestone.dueDate, 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => onMilestoneClick?.(milestone, milestones.indexOf(milestone))}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 