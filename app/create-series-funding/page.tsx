'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ethers } from 'ethers';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const categories = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Entertainment',
  'Art', 'Food', 'Environment', 'Social Impact', 'Other'
];

const CreateSeriesFundingPage = () => {
  const router = useRouter();
  const { blockchainService } = useBlockchainService();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [initialValuation, setInitialValuation] = useState('');
  const [duration, setDuration] = useState('90'); // 90 days default
  const [milestones, setMilestones] = useState([
    { name: '', description: '', target: '', dueDate: '' }
  ]);
  const [mediaUrls, setMediaUrls] = useState(['']);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Add milestone input field
  const addMilestone = () => {
    setMilestones([
      ...milestones,
      { name: '', description: '', target: '', dueDate: '' }
    ]);
  };

  // Remove milestone input field
  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  // Update milestone field
  const updateMilestone = (index: number, field: string, value: string) => {
    const updatedMilestones = [...milestones];
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      [field]: value
    };
    setMilestones(updatedMilestones);
  };

  // Add media URL field
  const addMediaUrl = () => {
    setMediaUrls([...mediaUrls, '']);
  };

  // Remove media URL field
  const removeMediaUrl = (index: number) => {
    if (mediaUrls.length <= 1) return;
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  // Update media URL
  const updateMediaUrl = (index: number, value: string) => {
    const updatedMediaUrls = [...mediaUrls];
    updatedMediaUrls[index] = value;
    setMediaUrls(updatedMediaUrls);
  };

  // Validation function
  const validate = () => {
    const errors: Record<string, string> = {};

    if (!title.trim()) errors.title = 'Title is required';
    if (!description.trim()) errors.description = 'Description is required';
    if (!category) errors.category = 'Category is required';
    if (!initialValuation || parseFloat(initialValuation) <= 0) {
      errors.initialValuation = 'Initial valuation must be greater than 0';
    }
    if (!duration || parseInt(duration) <= 0) {
      errors.duration = 'Duration must be greater than 0';
    }

    // Validate milestones
    milestones.forEach((milestone, index) => {
      if (!milestone.name.trim()) {
        errors[`milestone_${index}_name`] = 'Milestone name is required';
      }
      if (!milestone.target || parseFloat(milestone.target) <= 0) {
        errors[`milestone_${index}_target`] = 'Target amount must be greater than 0';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Format milestones for blockchain
      const formattedMilestones = milestones.map(milestone => ({
        name: milestone.name,
        description: milestone.description,
        target: ethers.utils.parseEther(milestone.target),
        dueDate: milestone.dueDate ? new Date(milestone.dueDate).getTime() / 1000 : 0,
        completed: false,
        fundsReleased: false
      }));
      
      // Filter out empty media URLs
      const filteredMediaUrls = mediaUrls.filter(url => url.trim());
      
      // Create campaign params
      const campaignParams = {
        title,
        description,
        category,
        goalAmount: ethers.utils.parseEther('0'), // Total goal is sum of milestone targets
        duration: parseInt(duration) * 86400, // Convert days to seconds
        media: filteredMediaUrls,
        milestones: formattedMilestones,
        campaignType: 2 // Series funding
      };
      
      // Call blockchain service to create campaign
      const campaignId = await blockchainService.createSeriesFundingCampaign(
        campaignParams,
        ethers.utils.parseEther(initialValuation)
      );
      
      toast({
        title: 'Campaign Created',
        description: `Series Funding campaign created with ID: ${campaignId}`
      });
      
      // Redirect to campaign page
      router.push(`/series-funding/${campaignId}`);
    } catch (error: any) {
      console.error('Error creating series funding campaign:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create campaign',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Series Funding Campaign</CardTitle>
          <CardDescription>
            Start your journey through seed, Series A, B, and C funding
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Campaign Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter campaign title"
                    className={validationErrors.title ? 'border-red-500' : ''}
                  />
                  {validationErrors.title && (
                    <p className="text-sm text-red-500">{validationErrors.title}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className={validationErrors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.category && (
                    <p className="text-sm text-red-500">{validationErrors.category}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project in detail"
                  className={`min-h-32 ${validationErrors.description ? 'border-red-500' : ''}`}
                />
                {validationErrors.description && (
                  <p className="text-sm text-red-500">{validationErrors.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initialValuation">Initial Valuation (TLOS)</Label>
                  <Input
                    id="initialValuation"
                    type="number"
                    value={initialValuation}
                    onChange={(e) => setInitialValuation(e.target.value)}
                    placeholder="Enter initial company valuation"
                    className={validationErrors.initialValuation ? 'border-red-500' : ''}
                    step="0.01"
                    min="0"
                  />
                  {validationErrors.initialValuation && (
                    <p className="text-sm text-red-500">{validationErrors.initialValuation}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Campaign Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Enter duration in days"
                    className={validationErrors.duration ? 'border-red-500' : ''}
                    min="1"
                  />
                  {validationErrors.duration && (
                    <p className="text-sm text-red-500">{validationErrors.duration}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Media URLs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Media URLs</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addMediaUrl}
                >
                  Add Media URL
                </Button>
              </div>
              
              {mediaUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => updateMediaUrl(index, e.target.value)}
                    placeholder="Enter media URL (image, video, etc.)"
                    className="flex-1"
                  />
                  {mediaUrls.length > 1 && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon"
                      onClick={() => removeMediaUrl(index)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <p className="text-sm text-gray-500">
                Add URLs to images, videos, or other media related to your campaign
              </p>
            </div>
            
            {/* Milestones */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Milestones</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addMilestone}
                >
                  Add Milestone
                </Button>
              </div>
              
              {milestones.map((milestone, index) => (
                <div key={index} className="p-4 border rounded-md space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Milestone {index + 1}</h4>
                    {milestones.length > 1 && (
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeMilestone(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`milestone-${index}-name`}>Name</Label>
                      <Input
                        id={`milestone-${index}-name`}
                        value={milestone.name}
                        onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                        placeholder="Milestone name"
                        className={validationErrors[`milestone_${index}_name`] ? 'border-red-500' : ''}
                      />
                      {validationErrors[`milestone_${index}_name`] && (
                        <p className="text-sm text-red-500">{validationErrors[`milestone_${index}_name`]}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`milestone-${index}-target`}>Target Amount (TLOS)</Label>
                      <Input
                        id={`milestone-${index}-target`}
                        type="number"
                        value={milestone.target}
                        onChange={(e) => updateMilestone(index, 'target', e.target.value)}
                        placeholder="Target amount"
                        className={validationErrors[`milestone_${index}_target`] ? 'border-red-500' : ''}
                        step="0.01"
                        min="0"
                      />
                      {validationErrors[`milestone_${index}_target`] && (
                        <p className="text-sm text-red-500">{validationErrors[`milestone_${index}_target`]}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`milestone-${index}-description`}>Description</Label>
                    <Textarea
                      id={`milestone-${index}-description`}
                      value={milestone.description}
                      onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                      placeholder="Describe this milestone"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`milestone-${index}-dueDate`}>Due Date</Label>
                    <Input
                      id={`milestone-${index}-dueDate`}
                      type="date"
                      value={milestone.dueDate}
                      onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Campaign...
                </>
              ) : 'Create Series Funding Campaign'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateSeriesFundingPage;