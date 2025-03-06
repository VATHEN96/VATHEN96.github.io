'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Clock, ListChecks, AlertTriangle, ChevronDown, ChevronUp, Image as ImageIcon, Film, Edit, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { format, addDays } from 'date-fns';
import { ethers } from 'ethers';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { categoryOptions, campaignTypeOptions } from './CampaignWizard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CampaignReviewFormProps {
  campaignData: {
    title: string;
    description: string;
    category: string;
    campaignType: string;
    duration: number;
    goalAmount: number;
    mainImage: string;
    additionalImages: string[];
    videoUrl?: string;
    milestones: Array<{
      name: string;
      description: string;
      percentage: number;
      dueDate?: Date;
      deliverables: string;
    }>;
  };
  onBack: () => void;
  onSubmit: () => void;
  onEdit: (step: number) => void;
  isSubmitting: boolean;
}

export default function CampaignReviewForm({ 
  campaignData, 
  onBack, 
  onSubmit, 
  onEdit,
  isSubmitting = false
}: CampaignReviewFormProps) {
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  
  // Calculate campaign start and end dates
  const startDate = new Date();
  const endDate = addDays(startDate, campaignData.duration);
  
  // Format currency
  const formatEth = (amount: number) => {
    return `${amount} ETH`;
  };

  // Get category and campaign type labels
  const getCategoryLabel = (value: string) => {
    const category = categoryOptions.find(cat => cat.value === value);
    return category ? category.label : 'Unknown';
  };

  const getCampaignTypeLabel = (value: string) => {
    const type = campaignTypeOptions.find(type => type.value === value);
    return type ? type.label : 'Unknown';
  };

  // Validation checks
  const validationErrors = [
    {
      title: 'Main Image Required',
      condition: !campaignData.mainImage,
      message: 'Add a main image to your campaign to make it more attractive to contributors',
      step: 3
    },
    {
      title: 'Video Recommended',
      condition: !campaignData.videoUrl,
      message: 'Campaigns with videos are 50% more likely to succeed. Consider adding a video.',
      step: 3,
      isWarning: true
    },
    {
      title: 'Short Title',
      condition: campaignData.title.length < 20,
      message: 'Consider using a more descriptive title to better explain your campaign',
      step: 1,
      isWarning: true
    },
    {
      title: 'Short Description',
      condition: campaignData.description.length < 300,
      message: 'A more detailed description will help contributors understand your project better',
      step: 1,
      isWarning: true
    },
    {
      title: 'Few Milestones',
      condition: campaignData.milestones.length < 2,
      message: 'Breaking your project into multiple milestones increases credibility',
      step: 2,
      isWarning: true
    }
  ];

  const hasErrors = validationErrors.some(error => !error.isWarning && error.condition);
  const hasWarnings = validationErrors.some(error => error.isWarning && error.condition);
  const filteredErrors = validationErrors.filter(error => error.condition);

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Review Your Campaign</CardTitle>
          <CardDescription>
            Review your campaign details before submitting
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {filteredErrors.length > 0 && (
            <div className="mb-6">
              <Button
                type="button"
                variant="outline"
                className={`w-full justify-between ${hasErrors ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'}`}
                onClick={() => setShowValidationErrors(!showValidationErrors)}
              >
                <div className="flex items-center">
                  <AlertTriangle className={`h-5 w-5 mr-2 ${hasErrors ? 'text-red-500' : 'text-yellow-500'}`} />
                  <span className={hasErrors ? 'text-red-700' : 'text-yellow-700'}>
                    {hasErrors 
                      ? `${filteredErrors.filter(e => !e.isWarning).length} errors need to be fixed` 
                      : `${filteredErrors.length} recommendations to improve your campaign`
                    }
                  </span>
                </div>
                {showValidationErrors ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
              
              {showValidationErrors && (
                <div className="mt-4 space-y-3">
                  {filteredErrors.map((error, index) => (
                    <Alert 
                      key={index} 
                      className={error.isWarning ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}
                    >
                      <AlertTriangle className={`h-4 w-4 ${error.isWarning ? 'text-yellow-500' : 'text-red-500'}`} />
                      <AlertTitle className={error.isWarning ? 'text-yellow-800' : 'text-red-800'}>
                        {error.title}
                      </AlertTitle>
                      <AlertDescription className="flex justify-between items-center">
                        <span className={error.isWarning ? 'text-yellow-700' : 'text-red-700'}>
                          {error.message}
                        </span>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className={`${error.isWarning ? 'border-yellow-300 bg-yellow-100 hover:bg-yellow-200' : 'border-red-300 bg-red-100 hover:bg-red-200'} text-xs`}
                          onClick={() => onEdit(error.step)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="rounded-lg overflow-hidden border border-gray-200 aspect-video mb-4">
                {campaignData.mainImage ? (
                  <img 
                    src={campaignData.mainImage} 
                    alt={campaignData.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/1200x675/e2e8f0/64748b?text=Image+Preview';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center p-4">
                      <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">No main image provided</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary" className="flex gap-1 items-center">
                  <Clock className="h-3 w-3" />
                  {campaignData.duration} days
                </Badge>
                <Badge variant="outline" className="flex gap-1 items-center">
                  {getCategoryLabel(campaignData.category)}
                </Badge>
                <Badge 
                  variant={campaignData.campaignType === '1' ? 'default' : 'outline'} 
                  className="flex gap-1 items-center"
                >
                  {getCampaignTypeLabel(campaignData.campaignType)}
                </Badge>
                {campaignData.videoUrl && (
                  <Badge variant="outline" className="flex gap-1 items-center">
                    <Film className="h-3 w-3" />
                    Video Included
                  </Badge>
                )}
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="pb-2 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Goal Amount</h3>
                    <p className="text-2xl font-bold">{formatEth(campaignData.goalAmount)}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                      <p className="font-medium">{format(startDate, 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                      <p className="font-medium">{format(endDate, 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Milestones</h3>
                    <p className="font-medium">{campaignData.milestones.length} milestone{campaignData.milestones.length !== 1 ? 's' : ''}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">{campaignData.title}</h2>
                <p className="mt-2 text-gray-600 line-clamp-3">{campaignData.description}</p>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="mt-1 p-0 h-auto text-blue-600"
                  onClick={() => onEdit(1)}
                >
                  Edit Basic Info
                </Button>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="milestones">
                  <AccordionTrigger className="py-2">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-4 w-4" />
                      Milestones
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {campaignData.milestones.map((milestone, index) => (
                        <Card key={index} className="overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b">
                            <div className="flex justify-between items-center">
                              <h3 className="font-medium text-sm">Milestone {index + 1}: {milestone.name}</h3>
                              <Badge variant="outline">{milestone.percentage}%</Badge>
                            </div>
                          </div>
                          <CardContent className="p-4 space-y-2 text-sm">
                            <p className="text-gray-600">{milestone.description}</p>
                            {milestone.dueDate && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>Target: {format(milestone.dueDate, 'MMM d, yyyy')}</span>
                              </div>
                            )}
                            {milestone.deliverables && (
                              <div>
                                <p className="font-medium text-xs mt-2 text-gray-700">Deliverables:</p>
                                <p className="text-gray-600">{milestone.deliverables}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => onEdit(2)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Milestones
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="media">
                  <AccordionTrigger className="py-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Media
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-sm mb-2">Main Image</h3>
                        {campaignData.mainImage ? (
                          <div className="aspect-video max-h-[150px] overflow-hidden rounded-md">
                            <img 
                              src={campaignData.mainImage} 
                              alt="Main" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/1200x675/e2e8f0/64748b?text=Image+Preview';
                              }}
                            />
                          </div>
                        ) : (
                          <p className="text-red-500 text-sm">No main image provided</p>
                        )}
                      </div>
                      
                      {campaignData.additionalImages && campaignData.additionalImages.length > 0 && (
                        <div>
                          <h3 className="font-medium text-sm mb-2">Additional Images ({campaignData.additionalImages.length})</h3>
                          <div className="grid grid-cols-3 gap-2">
                            {campaignData.additionalImages.map((image, index) => (
                              <div key={index} className="aspect-square overflow-hidden rounded-md">
                                <img 
                                  src={image} 
                                  alt={`Additional ${index + 1}`} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/e2e8f0/64748b?text=Image';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {campaignData.videoUrl && (
                        <div>
                          <h3 className="font-medium text-sm mb-2">Video</h3>
                          <p className="text-sm text-gray-600 truncate">{campaignData.videoUrl}</p>
                        </div>
                      )}
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => onEdit(3)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Media
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => onEdit(0)}
              disabled={isSubmitting}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
            <Button 
              type="button" 
              onClick={onSubmit} 
              disabled={hasErrors || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Create Campaign
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 