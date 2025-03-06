'use client';

import React, { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, FileImage, ExternalLink, Trash2, Upload, Info, Image as ImageIcon, Film } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

// Define the schema for media
const mediaSchema = z.object({
  mainImage: z.string().url('Please enter a valid URL').min(1, 'Main image is required'),
  additionalImages: z.array(z.string().url('Please enter a valid URL')),
  videoUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  mediaConsent: z.boolean().refine(value => value === true, {
    message: 'You must confirm that you have the rights to use these media'
  })
});

type MediaFormValues = z.infer<typeof mediaSchema>;

interface CampaignMediaFormProps {
  onNext: (data: MediaFormValues) => void;
  onBack: () => void;
  defaultValues?: Partial<MediaFormValues>;
  tips?: string[];
}

export default function CampaignMediaForm({ 
  onNext, 
  onBack, 
  defaultValues,
  tips = []
}: CampaignMediaFormProps) {
  const [additionalImageUrl, setAdditionalImageUrl] = useState<string>('');
  const [additionalImagesPreview, setAdditionalImagesPreview] = useState<string[]>(
    defaultValues?.additionalImages || []
  );

  // Initialize the form
  const form = useForm<MediaFormValues>({
    resolver: zodResolver(mediaSchema),
    defaultValues: {
      mainImage: defaultValues?.mainImage || '',
      additionalImages: defaultValues?.additionalImages || [],
      videoUrl: defaultValues?.videoUrl || '',
      mediaConsent: defaultValues?.mediaConsent || false
    }
  });

  // Handle form submission
  const onSubmit = (data: MediaFormValues) => {
    onNext(data);
  };

  // Handle adding an additional image
  const handleAddImage = () => {
    if (!additionalImageUrl) return;
    
    try {
      // Validate URL
      new URL(additionalImageUrl);
      
      // Update form value
      const currentImages = form.getValues().additionalImages || [];
      form.setValue('additionalImages', [...currentImages, additionalImageUrl]);
      
      // Update preview state
      setAdditionalImagesPreview(prev => [...prev, additionalImageUrl]);
      
      // Clear input
      setAdditionalImageUrl('');
    } catch (error) {
      form.setError('additionalImages', { 
        type: 'manual', 
        message: 'Please enter a valid URL' 
      });
    }
  };

  // Handle removing an additional image
  const handleRemoveImage = (index: number) => {
    const currentImages = form.getValues().additionalImages || [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    
    form.setValue('additionalImages', updatedImages);
    setAdditionalImagesPreview(updatedImages);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Campaign Media</CardTitle>
          <CardDescription>
            Add compelling visuals to make your campaign stand out
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <Tabs defaultValue="images" className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="images" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Images
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex items-center gap-2">
                    <Film className="h-4 w-4" />
                    Video
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="images" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="mainImage"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Main Campaign Image <span className="text-red-500">*</span></FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" type="button" className="h-6 w-6">
                                  <Info className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  This is the primary image displayed on your campaign card. Recommended size: 1200×675px (16:9)
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/your-image.jpg" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Enter a URL to your main campaign image
                        </FormDescription>
                        <FormMessage />
                        
                        {field.value && (
                          <div className="mt-4 border rounded-md p-2 relative group">
                            <div className="aspect-video w-full overflow-hidden rounded-md">
                              <img 
                                src={field.value} 
                                alt="Main campaign preview" 
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://placehold.co/1200x675/e2e8f0/64748b?text=Image+Preview';
                                }}
                              />
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="gap-1"
                                onClick={() => form.setValue('mainImage', '')}
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel>Additional Images</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" type="button" className="h-6 w-6">
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Add more images to showcase different aspects of your project
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                      <Input
                        placeholder="https://example.com/additional-image.jpg"
                        value={additionalImageUrl}
                        onChange={(e) => setAdditionalImageUrl(e.target.value)}
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={handleAddImage}
                      >
                        Add
                      </Button>
                    </div>
                    
                    <FormMessage>
                      {form.formState.errors.additionalImages?.message}
                    </FormMessage>
                    
                    {additionalImagesPreview.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                        {additionalImagesPreview.map((image, index) => (
                          <div key={index} className="border rounded-md p-1 relative group">
                            <div className="aspect-square w-full overflow-hidden rounded-md">
                              <img 
                                src={image} 
                                alt={`Additional image ${index + 1}`} 
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/e2e8f0/64748b?text=Image';
                                }}
                              />
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="gap-1"
                                onClick={() => handleRemoveImage(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="video" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Campaign Video URL</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" type="button" className="h-6 w-6">
                                  <Info className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Add a YouTube or Vimeo video link to introduce your campaign. Campaigns with videos are 50% more likely to succeed.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <Input 
                            placeholder="https://youtube.com/watch?v=your-video-id" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Enter a URL to your campaign video on YouTube or Vimeo
                        </FormDescription>
                        <FormMessage />
                        
                        {field.value && (
                          <div className="mt-4 border rounded-md p-2">
                            <Alert className="bg-blue-50 border-blue-200">
                              <FileImage className="h-4 w-4 text-blue-500" />
                              <AlertTitle>Video Preview</AlertTitle>
                              <AlertDescription className="flex items-center gap-2">
                                <span className="truncate">{field.value}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => window.open(field.value, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <h4 className="font-medium text-sm mb-2 text-yellow-800">Video Best Practices</h4>
                    <ul className="text-sm space-y-1 text-yellow-700">
                      <li>Keep your video under 2-3 minutes for optimal engagement</li>
                      <li>Introduce yourself and your team to build trust</li>
                      <li>Clearly explain what problem your project solves</li>
                      <li>Show a prototype or demonstration if possible</li>
                      <li>End with a clear call-to-action for contributors</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
              
              <FormField
                control={form.control}
                name="mediaConsent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I confirm that I have the rights to use all media content provided
                      </FormLabel>
                      <FormDescription>
                        You must have permission or own the rights to all images and videos used in your campaign
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              {tips && tips.length > 0 && (
                <Card className="bg-blue-50 border-blue-200 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      <Info className="h-4 w-4 mr-2 text-blue-500" />
                      Tips for compelling campaign visuals
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