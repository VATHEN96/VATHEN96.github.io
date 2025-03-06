'use client';

import React, { useEffect, useState } from 'react';
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
import { format, addDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

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

  // Calculate campaign end date
  const campaignEndDate = addDays(campaignStartDate, campaignDuration);
  
  // Initialize the form
  const form = useForm<MilestonesFormValues>({
    resolver: zodResolver(milestonesSchema),
    defaultValues: {
      milestones: defaultValues?.milestones || [
        {
          name: 'Initial Milestone',
          description: 'The first phase of the project',
          percentage: 33,
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

  // Add a new milestone
  const addMilestone = () => {
    append({
      name: `Milestone ${fields.length + 1}`,
      description: '',
      percentage: 0,
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
          <CardTitle className="text-2xl">Campaign Milestones</CardTitle>
          <CardDescription>
            Define clear milestones to show contributors how you'll deliver your project
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Campaign Timeline</h3>
                  <div className="text-xs text-gray-500">
                    {format(campaignStartDate, 'MMM d, yyyy')} - {format(campaignEndDate, 'MMM d, yyyy')}
                  </div>
                </div>
                <Progress value={100} className="h-2 mb-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Start</span>
                  <span>{campaignDuration} days</span>
                  <span>End</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Funding Milestones</h3>
                <div className={cn(
                  "text-sm font-medium",
                  totalPercentage === 100 ? "text-green-600" : "text-orange-500"
                )}>
                  Total: {totalPercentage}%
                </div>
              </div>
              
              {showValidationWarning && (
                <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm flex items-start gap-2">
                  <Info className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-orange-800">Milestone allocation incomplete</p>
                    <p className="text-orange-700">
                      Your milestone percentages must add up to exactly 100%. 
                      <Button 
                        type="button" 
                        variant="link" 
                        className="p-0 h-auto text-sm text-blue-600"
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
                  <div key={field.id} className="border rounded-lg p-4 relative">
                    <div className="absolute -top-3 left-4 bg-white px-2 text-sm font-medium text-gray-500">
                      Milestone {index + 1}
                    </div>
                    
                    <div className="absolute -top-3 right-4 bg-white px-2 text-xs font-medium rounded-full border">
                      {form.watch(`milestones.${index}.percentage`)}% of funds
                    </div>
                    
                    <div className="space-y-4 mt-2">
                      <FormField
                        control={form.control}
                        name={`milestones.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Milestone Name</FormLabel>
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
                            <FormLabel>Description</FormLabel>
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
                              <FormLabel>
                                Funding Percentage ({field.value}%)
                              </FormLabel>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  min={0}
                                  max={100}
                                  step={1}
                                  onValueChange={(value) => field.onChange(value[0])}
                                />
                              </FormControl>
                              <FormDescription>
                                Percentage of total funds allocated to this milestone
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
                              <FormLabel>Target Completion Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => 
                                      date < campaignStartDate || date > campaignEndDate
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormDescription>
                                When you expect to complete this milestone
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name={`milestones.${index}.deliverables`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Key Deliverables</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List specific deliverables that will be completed" 
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
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-2"
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
                  className="w-full" 
                  onClick={addMilestone}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </div>
              
              {tips && tips.length > 0 && (
                <Card className="bg-blue-50 border-blue-200 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      <Info className="h-4 w-4 mr-2 text-blue-500" />
                      Tips for effective milestones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
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