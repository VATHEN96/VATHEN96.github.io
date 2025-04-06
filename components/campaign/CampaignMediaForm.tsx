'use client';

import React, { useState, useRef } from 'react';
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
import { ArrowLeft, ArrowRight, FileImage, ExternalLink, Trash2, Upload, Info, Image as ImageIcon, Film, Link as LinkIcon, Check, X, PencilLine, AlertCircle } from 'lucide-react';
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
import FileUpload, { UploadedFile } from '@/components/FileUpload';
import Link from 'next/link';

// Define the schema for media
const mediaSchema = z.object({
  mainImage: z.string().optional(),
  mainImageUrl: z.string().optional(),
  additionalImages: z.array(z.string()),
  videoUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  mediaConsent: z.boolean().refine(value => value === true, {
    message: 'You must confirm that you have the rights to use these media'
  })
}).refine((data) => data.mainImage || data.mainImageUrl, {
  message: 'Main image is required',
  path: ['mainImage']
});

type MediaFormValues = z.infer<typeof mediaSchema>;

interface CampaignMediaFormProps {
  onNext: (data: MediaFormValues) => void;
  onBack: () => void;
  defaultValues?: Partial<MediaFormValues>;
  tips?: string[];
  campaignId?: string;
}

export default function CampaignMediaForm({ 
  onNext, 
  onBack, 
  defaultValues,
  tips = [],
  campaignId
}: CampaignMediaFormProps) {
  const [additionalImageUrl, setAdditionalImageUrl] = useState<string>('');
  const [additionalImagesPreview, setAdditionalImagesPreview] = useState<string[]>(
    defaultValues?.additionalImages || []
  );
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>(defaultValues?.mainImage || '');
  const [mainImageError, setMainImageError] = useState<string>('');
  const [isCloudinary, setIsCloudinary] = useState<boolean>(false);

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

  // Handle file upload for main image
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Add campaign ID if available
      if (campaignId) {
        formData.append('campaignId', campaignId);
      }
      
      // Upload to Cloudinary via our API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      
      // Update form with the Cloudinary URL
      form.setValue('mainImage', data.url);
      setMainImagePreview(data.url);
      setIsCloudinary(isCloudinaryUrl(data.url));
      
      console.log('Main image uploaded to Cloudinary:', data);
    } catch (error) {
      console.error('Error uploading file:', error);
      setMainImageError('Failed to upload image. Please try again.');
    }
  };

  // Handle file upload for additional images
  const handleAdditionalFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      // Process each file and upload to Cloudinary
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add campaign ID if available
        if (campaignId) {
          formData.append('campaignId', campaignId);
        }
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        return await response.json();
      });

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);
      const urls = results.map(result => result.url);
      
      // Update form with the new URLs
      const existingUrls = form.getValues('additionalImages') || [];
      const newUrls = [...existingUrls, ...urls];
      form.setValue('additionalImages', newUrls);
      setAdditionalImagesPreview(newUrls);
      
      console.log('Additional images uploaded to Cloudinary:', urls);
    } catch (error) {
      console.error('Error uploading additional files:', error);
      setMainImageError('Failed to upload one or more additional images.');
    }
  };

  // Validate if a URL is a Cloudinary URL
  const isCloudinaryUrl = (url: string): boolean => {
    if (!url) return false;
    const cloudinaryPattern = /^https:\/\/res\.cloudinary\.com\/[^\/]+\//i;
    return cloudinaryPattern.test(url);
  };

  // Handle main image upload using FileUpload component
  const handleMainImageUpload = (uploadedFiles: UploadedFile[]) => {
    if (uploadedFiles && uploadedFiles.length > 0) {
      const uploadedFile = uploadedFiles[0];
      
      // Set the main image URL in the form
      form.setValue('mainImage', uploadedFile.url);
      setMainImagePreview(uploadedFile.url);
      setMainImageError('');
      setIsCloudinary(!!uploadedFile.isCloudinary);
      
      console.log('Main image uploaded:', uploadedFile.url);
    }
  };

  // Handle additional images upload using FileUpload component
  const handleAdditionalImagesUpload = (uploadedFiles: UploadedFile[]) => {
    if (uploadedFiles && uploadedFiles.length > 0) {
      // Get existing additional images
      const existingUrls = form.getValues('additionalImages') || [];
      
      // Add new uploaded URLs
      const newUrls = [...existingUrls, ...uploadedFiles.map(file => file.url)];
      
      // Update form values and preview
      form.setValue('additionalImages', newUrls);
      setAdditionalImagesPreview(newUrls);
      setMainImageError('');
      
      console.log('Additional images uploaded:', newUrls);
    }
  };

  // Handle removing main image
  const handleRemoveMainImage = () => {
    form.setValue('mainImage', '');
    setMainImagePreview('');
    setIsCloudinary(false);
  };

  // Handle direct input of image URLs (for manual entry)
  const handleMainImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    form.setValue('mainImageUrl', url);
    setMainImagePreview(url);
    setIsCloudinary(isCloudinaryUrl(url));
  };

  // Validate before proceeding to next step
  const handleNext = () => {
    const mainImage = form.getValues('mainImage');
    
    // Validate main image
    if (!mainImage) {
      setMainImageError('A main image is required for your campaign');
      return;
    }
    
    // Optional: Check if the main image is from Cloudinary
    if (!isCloudinaryUrl(mainImage)) {
      setMainImageError('The image URL does not appear to be valid. Please upload using the provided tool.');
      return;
    }
    
    // Validate additional images
    const additionalImages = form.getValues('additionalImages') || [];
    const invalidImages = additionalImages.filter(url => !isCloudinaryUrl(url));
    if (invalidImages.length > 0) {
      setMainImageError('Some additional image URLs do not appear to be valid');
      return;
    }
    
    // All validations passed, proceed to next step
    onNext(form.getValues() as MediaFormValues);
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
                        <div className="space-y-4 mt-6">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium">Main Campaign Image</h3>
                            {isCloudinary && (
                              <span className="text-xs text-green-600 flex items-center">
                                <Check className="h-4 w-4 mr-1" /> Cloudinary Optimized
                              </span>
                            )}
                          </div>
                          
                          {/* Main image preview */}
                          {field.value ? (
                            <div className="relative rounded-md border overflow-hidden">
                              <img 
                                src={field.value} 
                                alt="Main campaign image" 
                                className="w-full h-auto aspect-video object-cover"
                                onError={() => setMainImageError('Image URL is invalid or cannot be loaded')}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => {
                                    field.onChange('');
                                    setMainImagePreview('');
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Direct upload option */}
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium">Upload Image</label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="file"
                                      id="mainImage"
                                      ref={fileInputRef}
                                      accept="image/*"
                                      className="hidden"
                                      onChange={handleFileUpload}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => fileInputRef.current?.click()}
                                      className="w-full flex items-center gap-2"
                                    >
                                      <Upload className="h-4 w-4" /> Choose Image
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Recommended: 16:9 ratio, max 10MB
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium">Or Enter Image URL</label>
                                  <Input
                                    type="url"
                                    placeholder="https://example.com/image.jpg"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                      setIsCloudinary(isCloudinaryUrl(e.target.value));
                                    }}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Direct image URL (Cloudinary URLs recommended)
                                  </p>
                                </div>
                              </div>
                            </>
                          )}
                          
                          {mainImageError && (
                            <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
                              {mainImageError}
                            </div>
                          )}
                        </div>
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
                    
                    <Tabs defaultValue="url" className="w-full">
                      <TabsList className="grid grid-cols-2 mb-4">
                        <TabsTrigger value="url" className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          Enter URL
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Upload Files
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="url">
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
                      </TabsContent>
                      
                      <TabsContent value="upload">
                        <div className="flex flex-col gap-2">
                          <input
                            type="file"
                            ref={additionalFileInputRef}
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleAdditionalFileUpload}
                          />
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => additionalFileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full py-6 border-dashed"
                          >
                            {uploading ? (
                              <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Uploading...
                              </span>
                            ) : (
                              <span className="flex flex-col items-center gap-2">
                                <Upload className="h-6 w-6" />
                                <span>Click to select files or drag and drop</span>
                                <span className="text-xs text-gray-500">Upload multiple images at once</span>
                              </span>
                            )}
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <FormMessage>
                      {form.formState.errors.additionalImages?.message}
                    </FormMessage>
                    
                    {additionalImagesPreview.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                        {additionalImagesPreview.map((url, index) => (
                          <div key={index} className="relative rounded-md border overflow-hidden">
                            <img
                              src={url}
                              alt={`Additional image ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const updatedImages = additionalImagesPreview.filter((_, i) => i !== index);
                                  setAdditionalImagesPreview(updatedImages);
                                  form.setValue('additionalImages', updatedImages);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
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