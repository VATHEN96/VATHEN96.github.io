'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWowzaRush } from '@/context/wowzarushContext';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import Navbar from '@/components/navbar';
import CampaignTemplateSelector, { CampaignTemplate } from './CampaignTemplateSelector';
import CampaignBasicInfoForm from './CampaignBasicInfoForm';
import CampaignMilestonesForm from './CampaignMilestonesForm';
import CampaignMediaForm from './CampaignMediaForm';
import CampaignReviewForm from './CampaignReviewForm';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define step types for our wizard
enum WizardStep {
  TEMPLATE_SELECTION = 0,
  BASIC_INFO = 1,
  MILESTONES = 2,
  MEDIA = 3,
  REVIEW = 4
}

// Global options for categories and campaign types
export const categoryOptions = [
  { value: '0', label: 'Technology' },
  { value: '1', label: 'Product' },
  { value: '2', label: 'Game' },
  { value: '3', label: 'Creative' },
  { value: '4', label: 'Community' },
  { value: '5', label: 'Charity' },
  { value: '6', label: 'Other' }
];

export const campaignTypeOptions = [
  { value: '0', label: 'Donation' },
  { value: '1', label: 'Investment' }
];

export default function CampaignWizard() {
  const router = useRouter();
  const { isWalletConnected, createCampaign } = useWowzaRush();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.TEMPLATE_SELECTION);
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Form data state
  const [campaignData, setCampaignData] = useState({
    title: '',
    description: '',
    category: '0',
    campaignType: '0',
    duration: 30,
    goalAmount: 1,
    mainImage: '',
    additionalImages: [] as string[],
    videoUrl: '',
    mediaConsent: false,
    milestones: [] as Array<{
      name: string;
      description: string;
      percentage: number;
      dueDate?: Date;
      deliverables: string;
    }>
  });
  
  // Set page title based on step
  useEffect(() => {
    document.title = `Create Campaign - ${getStepTitle(currentStep)} | WowzaRush`;
  }, [currentStep]);
  
  // Check wallet connection
  useEffect(() => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet to create a campaign');
    }
  }, [isWalletConnected]);
  
  // Handle template selection
  const handleTemplateSelect = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    
    // Pre-populate form with template defaults
    setCampaignData(prev => ({
      ...prev,
      title: template.defaultValues.title,
      description: template.defaultValues.description,
      category: template.defaultValues.category.toString(),
      campaignType: template.defaultValues.campaignType.toString(),
      duration: template.defaultValues.duration,
      goalAmount: template.defaultValues.minGoalAmount,
      milestones: template.defaultValues.suggestedMilestones.map(m => ({
        name: m.name,
        description: m.description,
        percentage: m.percentage,
        deliverables: ''
      }))
    }));
    
    // Move to next step
    setCurrentStep(WizardStep.BASIC_INFO);
  };
  
  // Handle basic info form submission
  const handleBasicInfoSubmit = (data: any) => {
    setCampaignData(prev => ({
      ...prev,
      title: data.title,
      description: data.description,
      category: data.category,
      campaignType: data.campaignType,
      duration: data.duration,
      goalAmount: data.goalAmount
    }));
    
    setCurrentStep(WizardStep.MILESTONES);
  };
  
  // Handle milestones form submission
  const handleMilestonesSubmit = (data: any) => {
    setCampaignData(prev => ({
      ...prev,
      milestones: data.milestones
    }));
    
    setCurrentStep(WizardStep.MEDIA);
  };
  
  // Handle media form submission
  const handleMediaSubmit = (data: any) => {
    setCampaignData(prev => ({
      ...prev,
      mainImage: data.mainImage,
      additionalImages: data.additionalImages,
      videoUrl: data.videoUrl,
      mediaConsent: data.mediaConsent
    }));
    
    setCurrentStep(WizardStep.REVIEW);
  };
  
  // Handle campaign creation
  const handleCreateCampaign = async () => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet to create a campaign');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format milestones for contract
      const formattedMilestones = campaignData.milestones.map(milestone => ({
        name: milestone.name,
        target: milestone.percentage,
        dueDate: milestone.dueDate ? Math.floor(milestone.dueDate.getTime() / 1000) : undefined
      }));
      
      // Format media for storage
      const media = [
        campaignData.mainImage,
        ...campaignData.additionalImages
      ].filter(Boolean);
      
      if (campaignData.videoUrl) {
        media.push(campaignData.videoUrl);
      }
      
      // Create campaign using context function
      const campaignId = await createCampaign({
        title: campaignData.title,
        description: campaignData.description,
        category: parseInt(campaignData.category),
        goalAmount: ethers.utils.parseEther(campaignData.goalAmount.toString()),
        duration: campaignData.duration,
        media,
        milestones: formattedMilestones,
        campaignType: parseInt(campaignData.campaignType),
        equityPercentage: campaignData.campaignType === '1' ? 10 : undefined, // Default equity percentage for investment campaigns
        minInvestment: campaignData.campaignType === '1' ? ethers.utils.parseEther('0.1') : undefined // Default min investment
      });
      
      toast.success('Campaign created successfully!');
      
      // Redirect to the campaign page
      setTimeout(() => {
        router.push(`/campaign/${campaignId}`);
      }, 2000);
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Navigate to a specific step
  const navigateToStep = (step: WizardStep) => {
    // Only allow backward navigation
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };
  
  // Handle going back
  const handleBack = () => {
    if (currentStep > WizardStep.TEMPLATE_SELECTION) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Get step title
  const getStepTitle = (step: WizardStep): string => {
    switch (step) {
      case WizardStep.TEMPLATE_SELECTION:
        return 'Choose Template';
      case WizardStep.BASIC_INFO:
        return 'Basic Info';
      case WizardStep.MILESTONES:
        return 'Milestones';
      case WizardStep.MEDIA:
        return 'Media';
      case WizardStep.REVIEW:
        return 'Review';
      default:
        return '';
    }
  };
  
  // Calculate progress percentage
  const getProgressPercentage = (): number => {
    return (currentStep / 4) * 100;
  };
  
  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.TEMPLATE_SELECTION:
        return (
          <CampaignTemplateSelector onSelect={handleTemplateSelect} />
        );
      case WizardStep.BASIC_INFO:
        return (
          <CampaignBasicInfoForm 
            onNext={handleBasicInfoSubmit} 
            defaultValues={{
              title: campaignData.title,
              description: campaignData.description,
              category: campaignData.category,
              campaignType: campaignData.campaignType,
              duration: campaignData.duration,
              goalAmount: campaignData.goalAmount
            }}
            tips={selectedTemplate?.tips || []}
          />
        );
      case WizardStep.MILESTONES:
        return (
          <CampaignMilestonesForm 
            onNext={handleMilestonesSubmit} 
            onBack={handleBack}
            defaultValues={{
              milestones: campaignData.milestones
            }}
            campaignDuration={campaignData.duration}
            tips={[
              'Each milestone should represent a clear, measurable achievement',
              'Use specific deliverables that contributors can verify',
              'Allocate funding percentages based on the work required',
              'Set realistic timeline targets for each milestone'
            ]}
          />
        );
      case WizardStep.MEDIA:
        return (
          <CampaignMediaForm 
            onNext={handleMediaSubmit} 
            onBack={handleBack}
            defaultValues={{
              mainImage: campaignData.mainImage,
              additionalImages: campaignData.additionalImages,
              videoUrl: campaignData.videoUrl,
              mediaConsent: campaignData.mediaConsent
            }}
            tips={[
              'Use high-quality images that clearly showcase your project',
              'Include images of prototypes or mockups if available',
              'Create a short, engaging video explaining your campaign',
              'Show your face in the video to build trust with contributors'
            ]}
          />
        );
      case WizardStep.REVIEW:
        return (
          <CampaignReviewForm 
            campaignData={campaignData}
            onBack={handleBack}
            onSubmit={handleCreateCampaign}
            onEdit={(step) => navigateToStep(step as WizardStep)}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Create Your Campaign</h1>
        <p className="text-gray-600 mb-8">
          Follow the steps below to create a high-quality campaign
        </p>
        
        {currentStep > WizardStep.TEMPLATE_SELECTION && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-medium">
                Step {currentStep} of 4: {getStepTitle(currentStep)}
              </h2>
              <span className="text-sm text-gray-500">
                {getProgressPercentage()}% Complete
              </span>
            </div>
            
            <Progress value={getProgressPercentage()} className="h-2" />
            
            <Tabs value={currentStep.toString()} className="mt-4">
              <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
                <TabsTrigger 
                  value="1" 
                  onClick={() => navigateToStep(WizardStep.BASIC_INFO)}
                  disabled={currentStep < WizardStep.BASIC_INFO}
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  Basic Info
                </TabsTrigger>
                <TabsTrigger 
                  value="2" 
                  onClick={() => navigateToStep(WizardStep.MILESTONES)}
                  disabled={currentStep < WizardStep.MILESTONES}
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  Milestones
                </TabsTrigger>
                <TabsTrigger 
                  value="3" 
                  onClick={() => navigateToStep(WizardStep.MEDIA)}
                  disabled={currentStep < WizardStep.MEDIA}
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  Media
                </TabsTrigger>
                <TabsTrigger 
                  value="4" 
                  onClick={() => navigateToStep(WizardStep.REVIEW)}
                  disabled={currentStep < WizardStep.REVIEW}
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  Review
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        
        {renderStepContent()}
      </div>
    </div>
  );
} 