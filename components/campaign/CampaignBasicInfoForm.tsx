'use client';

import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowRight, HelpCircle, Info, Calendar } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CampaignTemplate } from './CampaignTemplateSelector';
import { addDays } from 'date-fns';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';

// Define the form schema with Zod
const basicInfoSchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string()
    .min(100, 'Description must be at least 100 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  category: z.string(),
  campaignType: z.string(),
  duration: z.coerce.number()
    .positive('Duration must be a positive number'),
  goalAmount: z.coerce.number()
    .min(0.1, 'Goal amount must be at least 0.1 TLOS'),
  equityPercentage: z.coerce.number()
    .min(0.01, 'Equity percentage must be at least 0.01%')
    .max(100, 'Equity percentage cannot exceed 100%')
    .optional(),
  minInvestment: z.coerce.number()
    .min(0.1, 'Minimum investment must be at least 0.1 TLOS')
    .optional()
});

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;

// Category options
const categoryOptions = [
  { value: '0', label: 'Technology' },
  { value: '1', label: 'Product' },
  { value: '2', label: 'Game' },
  { value: '3', label: 'Creative' },
  { value: '4', label: 'Community' },
  { value: '5', label: 'Charity' },
  { value: '6', label: 'Other' }
];

// Campaign type options
const campaignTypeOptions = [
  { value: '0', label: 'Donation' },
  { value: '1', label: 'Investment' }
];

interface CampaignBasicInfoFormProps {
  onNext: (data: BasicInfoFormValues) => void;
  defaultValues?: Partial<BasicInfoFormValues>;
  tips?: string[];
}

export default function CampaignBasicInfoForm({ 
  onNext, 
  defaultValues,
  tips = [] 
}: CampaignBasicInfoFormProps) {
  // Initialize form with default values
  const form = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      category: defaultValues?.category?.toString() || '0',
      campaignType: defaultValues?.campaignType?.toString() || '0',
      duration: defaultValues?.duration || 30,
      goalAmount: defaultValues?.goalAmount || 1,
      equityPercentage: defaultValues?.equityPercentage || 5,
      minInvestment: defaultValues?.minInvestment || 1
    }
  });

  // Handle form submission
  const onSubmit = (data: BasicInfoFormValues) => {
    console.log('Campaign Basic Info Form Data:', data);
    console.log('Campaign Duration:', data.duration, 'days');
    
    // Calculate the campaign end date
    const startDate = new Date();
    const endDate = addDays(startDate, data.duration);
    console.log('Campaign Start Date:', startDate);
    console.log('Campaign End Date:', endDate);
    
    // Pass the data to the parent component
    onNext(data);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-2 border-gray-200 rounded-lg shadow-sm">
        <CardHeader className="border-b border-gray-200 pb-4">
          <CardTitle className="text-xl font-semibold">Basic Info</CardTitle>
          <CardDescription>
            Provide the essential information about your campaign
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Campaign Title</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" type="button" className="h-6 w-6">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Create a clear, attention-grabbing title that explains what your campaign is about in a few words.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Input placeholder="Enter a compelling title for your campaign" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your title appears in campaign listings and search results
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Campaign Description</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" type="button" className="h-6 w-6">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Provide a clear description of your project, what problem it solves, and why it matters.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your campaign in detail..." 
                        className="min-h-[200px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="flex justify-between">
                      <span>Explain what you're raising funds for and why it matters</span>
                      <span className="text-gray-500">{field.value.length}/5000</span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Category</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" type="button" className="h-6 w-6">
                                <HelpCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Choose the category that best represents your campaign.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoryOptions.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the category that best fits your campaign
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="campaignType"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Campaign Type</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" type="button" className="h-6 w-6">
                                <HelpCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Donation: Backers donate without expectation of returns.<br />
                                Investment: Backers receive equity or other returns.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select campaign type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {campaignTypeOptions.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This determines how backers will contribute
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Campaign Duration</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" type="button" className="h-6 w-6">
                                <HelpCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                The number of days your campaign will be active.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="30"
                            {...field}
                            value={field.value === 0 ? '' : field.value}
                            onChange={(e) => {
                              // Handle empty input case
                              if (e.target.value === '') {
                                console.log('Empty input - clearing to empty string');
                                field.onChange(0); // Use 0 as internal value when empty
                                return;
                              }
                              
                              // Use the raw string value instead of parseInt to avoid issues
                              const rawValue = e.target.value;
                              const parsedValue = parseInt(rawValue, 10);
                              
                              // Only enforce minimum if we have a valid number
                              if (!isNaN(parsedValue)) {
                                const finalValue = Math.max(0, parsedValue);
                                console.log(`Setting duration: ${finalValue} days (raw input: ${rawValue})`);
                                field.onChange(finalValue);
                              } else {
                                // Keep field empty if not a valid number
                                field.onChange(0);
                              }
                            }}
                            className="pl-12"
                          />
                          <div className="absolute left-0 top-0 h-full flex items-center justify-center px-3 pointer-events-none text-gray-500 dark:text-gray-400">
                            <Calendar className="h-5 w-5" />
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        How long your campaign will run
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Goal Amount (TLOS)</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" type="button" className="h-6 w-6">
                                <HelpCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Set your funding goal in TLOS. This is the amount you aim to raise.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number"
                            min={0.1}
                            step={0.1}
                            placeholder="Enter goal amount in TLOS"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        The total amount of TLOS you want to raise
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {form.watch('campaignType') === '1' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border p-4 rounded-md border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
                  <h3 className="text-lg font-semibold col-span-2 text-yellow-800 dark:text-yellow-300">Investment Campaign Details</h3>
                  
                  <FormField
                    control={form.control}
                    name="equityPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Equity Percentage (%)</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" type="button" className="h-6 w-6">
                                  <HelpCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  The percentage of equity you're offering to investors. This is stored in basis points (e.g., 5% = 500 basis points).
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="number"
                              min={0.01}
                              max={100}
                              step={0.01}
                              placeholder="Enter equity percentage"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Percentage of equity offered to investors
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minInvestment"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Minimum Investment (TLOS)</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" type="button" className="h-6 w-6">
                                  <HelpCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  The minimum amount in TLOS that an investor must contribute.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="number"
                              min={0.1}
                              step={0.1}
                              placeholder="Enter minimum investment amount"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Minimum amount required to invest
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">Tips for a successful campaign</h3>
                <ul className="list-disc pl-5 space-y-2 text-black dark:text-white">
                  <li>Be clear and specific about your goals and how funds will be used</li>
                  <li>Include realistic milestones with achievable deadlines</li>
                  <li>Add high-quality images to make your campaign stand out</li>
                  <li>Explain why your project matters and how it benefits the community</li>
                  <li>Set a reasonable funding goal based on your project needs</li>
                </ul>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" disabled>
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