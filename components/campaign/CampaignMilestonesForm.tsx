'use client';

import React, { useEffect, useState, useRef } from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Clock, Flag, Plus, Trash2, Info } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format, addDays, differenceInDays, isAfter, isBefore, isEqual } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Define the milestone schema
const milestoneSchema = z.object({
  name: z.string()
    .min(5, 'Name must be at least 5 characters')
    .max(50, 'Name must be less than 50 characters'),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(500, 'Description must be less than 500 characters'),
  percentage: z.number()
    .min(1, 'Percentage must be at least 1%')
    .max(100, 'Percentage cannot exceed 100%'),
  dueDate: z.date().optional(),
  deliverables: z.string()
    .min(10, 'Deliverables must be at least 10 characters')
    .max(300, 'Deliverables must be less than 300 characters')
});

// Define the form schema
const milestonesSchema = z.object({
  milestones: z.array(milestoneSchema)
    .min(1, 'At least one milestone is required')
    .refine(
      (milestones) => {
        const totalPercentage = milestones.reduce((sum, milestone) => sum + milestone.percentage, 0);
        return totalPercentage === 100;
      },
      {
        message: 'Total milestone percentages must equal 100%',
        path: ['milestones']
      }
    )
    .refine(
      (milestones) => {
        // Check if all milestone dates are in chronological order
        for (let i = 1; i < milestones.length; i++) {
          const prevMilestone = milestones[i - 1];
          const currentMilestone = milestones[i];
          
          if (prevMilestone.dueDate && currentMilestone.dueDate &&
              new Date(currentMilestone.dueDate) <= new Date(prevMilestone.dueDate)) {
            return false;
          }
        }
        return true;
      },
      {
        message: 'Milestone dates must be in chronological order',
        path: ['milestones']
      }
    )
});

type MilestonesFormValues = z.infer<typeof milestonesSchema>;

interface CampaignMilestonesFormProps {
  onNext: (data: MilestonesFormValues) => void;
  onBack: () => void;
  defaultValues?: {
    milestones?: Array<{
      name: string;
      description: string;
      percentage: number;
      dueDate?: Date;
      deliverables: string;
    }>;
  };
  campaignDuration: number;
  campaignStartDate?: Date;
  tips?: string[];
}

export default function CampaignMilestonesForm({ 
  onNext, 
  onBack, 
  defaultValues,
  campaignDuration = 30,
  campaignStartDate = new Date(),
  tips = []
}: CampaignMilestonesFormProps) {
  
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  
  // Calculate campaign end date - CRITICAL FIX: Ensure campaignDuration is numeric
  const parsedDuration = parseInt(String(campaignDuration), 10) || 30;
  console.log('Campaign duration:', parsedDuration, 'days');
  
  // Force campaign end date calculation with numeric duration
  const campaignEndDate = addDays(campaignStartDate, parsedDuration);
  
  // Initialize the form with complete default values
  const form = useForm<MilestonesFormValues>({
    resolver: zodResolver(milestonesSchema),
    defaultValues: {
      milestones: defaultValues?.milestones?.length ? defaultValues.milestones.map(milestone => ({
        name: milestone.name || '',
        description: milestone.description || '',
        percentage: milestone.percentage || 0,
        dueDate: milestone.dueDate || undefined,
        deliverables: milestone.deliverables || ''
      })) : [
        {
          name: 'Initial Milestone',
          description: 'The first phase of the project',
          percentage: 33,
          dueDate: undefined,
          deliverables: 'Key deliverables for this milestone'
        }
      ]
    },
    mode: 'onChange'
  });
  
  // Use field array for managing multiple milestones
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'milestones'
  });

  // Calculate and update total percentage
  useEffect(() => {
    const values = form.watch('milestones');
    const total = values.reduce((sum, milestone) => sum + (milestone.percentage || 0), 0);
    setTotalPercentage(total);
    
    // Show warning if total percentage is not 100% and there are at least 2 milestones
    setShowValidationWarning(total !== 100 && values.length >= 1);
  }, [form.watch('milestones')]);

  // Handle form submission
  const onSubmit = (data: MilestonesFormValues) => {
    onNext(data);
  };

  // Add a new milestone with all required fields initialized
  const addMilestone = () => {
    append({
      name: `Milestone ${fields.length + 1}`,
      description: '',
      percentage: 0,
      dueDate: undefined,
      deliverables: ''
    });
  };

  // Auto-distribute remaining percentage
  const autoDistribute = () => {
    const values = form.getValues().milestones;
    const remaining = 100 - totalPercentage;
    
    if (remaining === 0 || values.length === 0) return;
    
    const distribution = Math.floor(remaining / values.length);
    const remainder = remaining % values.length;
    
    const newMilestones = values.map((milestone, index) => ({
      ...milestone,
      percentage: milestone.percentage + distribution + (index === 0 ? remainder : 0)
    }));
    
    form.reset({ milestones: newMilestones });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold mb-2">Campaign Milestones</CardTitle>
          <CardDescription className="text-lg">
            Define clear milestones to show contributors how you'll deliver your project
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-black dark:text-white">Campaign Timeline</h3>
                  <div className="text-xs text-gray-700 dark:text-gray-300">
                    {format(campaignStartDate, 'MMM d, yyyy')} - {format(campaignEndDate, 'MMM d, yyyy')}
                  </div>
                </div>
                <Progress value={100} className="h-2 mb-2" />
                <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                  <span>Start</span>
                  <span>{parsedDuration} days</span>
                  <span>End</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-black dark:text-white">Funding Milestones</h3>
                <div className={cn(
                  "text-base font-medium rounded-full px-3 py-1",
                  totalPercentage === 100 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                )}>
                  Total: {totalPercentage}%
                </div>
              </div>
              
              {showValidationWarning && (
                <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md p-3 text-sm flex items-start gap-2">
                  <Info className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-orange-800 dark:text-orange-200">Milestone allocation incomplete</p>
                    <p className="text-orange-700 dark:text-orange-300">
                      Your milestone percentages must add up to exactly 100%. 
                      <Button 
                        type="button" 
                        variant="link" 
                        className="p-0 h-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        onClick={autoDistribute}
                      >
                        Auto-distribute remaining {100 - totalPercentage}%
                      </Button>
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-8">
                {fields.map((field, index) => (
                  <div key={field.id} className="border dark:border-gray-700 rounded-lg p-5 relative">
                    <div className="absolute -top-3 left-4 bg-white dark:bg-black px-3 py-1 text-base font-bold text-gray-800 dark:text-gray-200 rounded-md border dark:border-gray-700">
                      Milestone {index + 1}
                    </div>
                    
                    <div className="absolute -top-3 right-4 bg-white dark:bg-black px-3 py-1 text-sm font-bold rounded-full border dark:border-gray-700 text-gray-800 dark:text-white">
                      {form.watch(`milestones.${index}.percentage`)}% of funds
                    </div>
                    
                    <div className="space-y-4 mt-2">
                      <FormField
                        control={form.control}
                        name={`milestones.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black dark:text-white">Milestone Name</FormLabel>
                            <FormControl>
                              <Input placeholder="E.g., Design Phase, MVP Launch" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`milestones.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black dark:text-white">Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe what will be accomplished in this milestone" 
                                className="min-h-[100px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`milestones.${index}.percentage`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-black dark:text-white">
                                Funding Percentage
                                <span className="ml-2 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-sm">
                                  {field.value}%
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  min={1}
                                  max={(() => {
                                    try {
                                      // Calculate the maximum possible value for this milestone
                                      const values = form.getValues().milestones || [];
                                      const currentValue = Number(field.value) || 0;
                                      
                                      // Calculate total from other milestones
                                      let otherTotal = 0;
                                      for (let i = 0; i < values.length; i++) {
                                        if (i !== index && values[i]) {
                                          otherTotal += Number(values[i].percentage) || 0;
                                        }
                                      }
                                      
                                      // Ensure non-negative values
                                      otherTotal = Math.max(0, otherTotal);
                                      
                                      // Available = 100 - otherTotal
                                      const available = Math.max(1, 100 - otherTotal);
                                      
                                      return Math.max(1, Math.min(100, available));
                                    } catch (e) {
                                      console.error("Error calculating max percentage:", e);
                                      return 100;
                                    }
                                  })()}
                                  step={1}
                                  onValueChange={(value) => field.onChange(value[0])}
                                />
                              </FormControl>
                              <FormDescription className="text-gray-600 dark:text-gray-400">
                                Percentage of total TLOS allocated to this milestone
                                {index > 0 && (
                                  <span className="block text-xs mt-1">
                                    Maximum: {(() => {
                                      try {
                                        // Calculate the maximum possible value for this milestone
                                        const values = form.getValues().milestones || [];
                                        
                                        // Calculate total from other milestones
                                        let otherTotal = 0;
                                        for (let i = 0; i < values.length; i++) {
                                          if (i !== index && values[i]) {
                                            otherTotal += Number(values[i].percentage) || 0;
                                          }
                                        }
                                        
                                        // Ensure non-negative values
                                        otherTotal = Math.max(0, otherTotal);
                                        
                                        // Available = 100 - otherTotal
                                        return Math.max(1, 100 - otherTotal);
                                      } catch (e) {
                                        return 100;
                                      }
                                    })()}%
                                  </span>
                                )}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`milestones.${index}.dueDate`}
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-base font-bold text-black dark:text-white">Target Completion Date</FormLabel>
                              
                              <div className="relative w-full">
                                <DatePicker
                                  selected={field.value || null}
                                  onChange={(date: Date | null) => field.onChange(date || undefined)}
                                  minDate={index === 0 ? campaignStartDate : (() => {
                                    // Get previous milestone date
                                    const prevMilestone = form.getValues().milestones[index - 1];
                                    if (prevMilestone?.dueDate) {
                                      const nextDay = new Date(prevMilestone.dueDate);
                                      nextDay.setDate(nextDay.getDate() + 1);
                                      return nextDay;
                                    }
                                    return campaignStartDate;
                                  })()}
                                  maxDate={campaignEndDate}
                                  dateFormat="MMMM d, yyyy"
                                  placeholderText="Select a target date"
                                  showMonthDropdown
                                  showYearDropdown
                                  dropdownMode="select"
                                  openToDate={field.value || campaignStartDate}
                                  isClearable={true}
                                  customInput={
                                    <button 
                                      className="flex items-center justify-between w-full h-12 px-4 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      type="button" 
                                    >
                                      <span className={field.value ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"}>
                                        {field.value ? format(field.value, "MMMM d, yyyy") : "Select a target date"}
                                      </span>
                                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                                    </button>
                                  }
                                  className="!w-full !rounded-md !border-gray-300 dark:!border-gray-600"
                                  calendarClassName="!bg-white !dark:bg-gray-800 !shadow-lg !rounded-lg !border !border-gray-200 !dark:border-gray-700 !z-50"
                                />
                              </div>
                              
                              <FormDescription className="text-base text-gray-600 dark:text-gray-400">
                                When you expect to complete this milestone  
                                {index > 0 && form.getValues().milestones[index - 1]?.dueDate && (
                                  <span className="block text-xs mt-1 text-amber-600 dark:text-amber-400">
                                    Must be after {format(new Date(form.getValues().milestones[index - 1].dueDate!), "MMMM d, yyyy")}
                                  </span>
                                )}
                                <span className="block text-xs mt-1 text-green-600 dark:text-green-400">
                                  Campaign runs from {format(campaignStartDate, "MMM d, yyyy")} to {format(campaignEndDate, "MMM d, yyyy")} ({parsedDuration} days)
                                </span>
                              </FormDescription>
                              <FormMessage className="text-base" />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name={`milestones.${index}.deliverables`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black dark:text-white">Proof of Completion</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List specific deliverables that will verify milestone completion" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {fields.length > 1 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className="text-red-500 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 mt-2 border-red-200 dark:border-red-800"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Milestone
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800" 
                  onClick={addMilestone}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </div>
              
              {/* Always display tips section with helpful guidance */}
              <div className="mt-8 p-5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="text-xl font-bold mb-3 text-blue-800 dark:text-blue-200 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-blue-500" />
                      Tips for effective milestones
                </h3>
                <ul className="list-disc pl-6 space-y-3 text-blue-900 dark:text-blue-300 text-base">
                  <li>Break your project into 3-5 clear, achievable milestones</li>
                  <li>Each milestone should deliver tangible, verifiable results</li>
                  <li>Set realistic deadlines within your campaign duration</li>
                  <li>Distribute funding percentages based on the work required for each phase</li>
                  <li>Be specific about deliverables - this helps backers understand what to expect</li>
                    </ul>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button type="submit">
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
} 