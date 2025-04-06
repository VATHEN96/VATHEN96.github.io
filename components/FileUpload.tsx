'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, CheckCircle2, AlertCircle, Info, Image as ImageIcon, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tooltip } from './ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useMediaQuery } from '../hooks/use-media-query';
import { cn } from '../lib/utils';

export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  isCloudinary?: boolean;
  progress?: number;
  error?: string;
  publicId?: string;
};

export enum FileUploadStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  SUCCESS = 'success',
  ERROR = 'error',
}

interface FileUploadProps {
  label?: string;
  description?: string;
  maxFiles?: number;
  maxSize?: number; // in bytes
  onUpload: (files: UploadedFile[]) => void;
  uploadedFiles?: UploadedFile[];
  campaignId?: string;
  className?: string;
}

// Supported file types with descriptions for better user feedback
export const acceptedFileTypes = {
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  'video/*': ['.mp4', '.mov', '.avi'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/zip': ['.zip'],
  'application/x-rar-compressed': ['.rar'],
};

const FileUpload: React.FC<FileUploadProps> = ({
  label = 'Upload files',
  description = 'Drag and drop files here, or click to select files',
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  onUpload,
  uploadedFiles = [],
  campaignId,
  className,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<FileUploadStatus>(FileUploadStatus.IDLE);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [webhookNotifications, setWebhookNotifications] = useState<Array<{id: string, message: string, type: string}>>([]);
  
  // Use media query hook for responsive design
  const isMobile = useMediaQuery('(max-width: 640px)');

  // Clear webhook notifications after 5 seconds
  useEffect(() => {
    if (webhookNotifications.length > 0) {
      const timer = setTimeout(() => {
        setWebhookNotifications(prev => 
          prev.filter(notification => 
            Date.now() - new Date(notification.id).getTime() < 5000
          )
        );
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [webhookNotifications]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Reset error state
      setError(null);
      
      // Validate number of files
      if (files.length + acceptedFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        // Only add files up to the limit
        const remainingSlots = maxFiles - files.length;
        if (remainingSlots <= 0) return;
        acceptedFiles = acceptedFiles.slice(0, remainingSlots);
      }
      
      // Validate file sizes
      const oversizedFiles = acceptedFiles.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        setError(`Some files exceed the maximum size of ${Math.round(maxSize / (1024 * 1024))}MB`);
        // Filter out oversized files
        acceptedFiles = acceptedFiles.filter(file => file.size <= maxSize);
        if (acceptedFiles.length === 0) return;
      }
      
      // Check file types match accepted types
      const invalidFiles = acceptedFiles.filter(file => {
        // Check if any accepted type matches this file
        return !Object.entries(acceptedFileTypes).some(([mimeType, extensions]) => {
          if (mimeType.endsWith('*')) {
            // For wildcard types like image/*, check if file.type starts with the base type
            const baseType = mimeType.split('/')[0];
            return file.type.startsWith(`${baseType}/`);
          }
          // For specific types, check exact match
          return file.type === mimeType;
        });
      });
      
      if (invalidFiles.length > 0) {
        setError(`Some files have unsupported formats`);
        // Filter out invalid files
        acceptedFiles = acceptedFiles.filter(file => !invalidFiles.includes(file));
        if (acceptedFiles.length === 0) return;
      }
      
      // Add accepted files to state
      setFiles(prev => [...prev, ...acceptedFiles]);
    },
    [files, maxFiles, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: acceptedFileTypes,
  });

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Check if a URL is a valid Cloudinary URL
  const isCloudinaryUrl = (url: string): boolean => {
    // Basic check for Cloudinary URL pattern
    // This can be enhanced to check for specific patterns or formats
    const cloudinaryPattern = /^https:\/\/res\.cloudinary\.com\/[^\/]+\//i;
    return cloudinaryPattern.test(url);
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploadStatus(FileUploadStatus.UPLOADING);
    setError(null);
    
    const uploadedFilesArray: UploadedFile[] = [];
    let hasError = false;

    // Process each file individually to track progress
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${file.name}-${Date.now()}`;
      
      // Initialize progress for this file
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: 0
      }));
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add campaign ID if available
        if (campaignId) {
          formData.append('campaignId', campaignId);
        }

        // Track upload progress
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: percentComplete
            }));
          }
        });

        // Upload the file
        const uploadPromise = new Promise<UploadedFile>((resolve, reject) => {
          xhr.open('POST', '/api/upload');
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText);
              
              // Validate Cloudinary URL
              if (!data.url || !isCloudinaryUrl(data.url)) {
                reject(new Error('Invalid upload URL returned'));
                return;
              }
              
              const uploadedFile: UploadedFile = {
                id: fileId,
                name: file.name,
                size: file.size,
                type: file.type,
                url: data.url,
                isCloudinary: true,
                publicId: data.public_id,
                progress: 100
              };
              resolve(uploadedFile);
              
              // Simulate a webhook notification
              setTimeout(() => {
                setWebhookNotifications(prev => [
                  ...prev, 
                  {
                    id: Date.now().toString(),
                    message: `File "${file.name}" processed successfully`,
                    type: 'success'
                  }
                ]);
              }, Math.random() * 2000 + 1000); // Random delay between 1-3 seconds
              
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.send(formData);
        });

        const uploadedFile = await uploadPromise;
        uploadedFilesArray.push(uploadedFile);
        
      } catch (err: any) {
        console.error(`Error uploading file ${file.name}:`, err);
        hasError = true;
        uploadedFilesArray.push({
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: '',
          error: err.message || 'Upload failed',
          progress: 0
        });
      }
    }

    // Set final upload status
    setUploadStatus(hasError ? FileUploadStatus.ERROR : FileUploadStatus.SUCCESS);
    
    // Call onUpload with successfully uploaded files
    if (uploadedFilesArray.length > 0) {
      const validUploads = uploadedFilesArray.filter(file => !file.error);
      if (validUploads.length > 0) {
        onUpload(validUploads);
      }
    }
    
    // Clear files state if all uploads were successful
    if (!hasError) {
      setFiles([]);
    } else {
      // Keep only failed files for retry
      const failedFileIndices = uploadedFilesArray
        .map((file, index) => file.error ? index : -1)
        .filter(index => index !== -1);
      
      setFiles(files.filter((_, i) => failedFileIndices.includes(i)));
    }
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Responsive label */}
      {label && (
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">{label}</h3>
          {isMobile && <Smartphone className="h-4 w-4 text-muted-foreground" />}
        </div>
      )}
      
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer",
          "flex flex-col items-center justify-center text-center gap-2",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          isMobile ? "p-3" : "p-8",
          "hover:border-primary/50 hover:bg-accent/5"
        )}
      >
        <input {...getInputProps()} />
        
        <div className={cn(
          "rounded-full bg-primary/10 p-2",
          isMobile ? "p-1.5" : "p-3"
        )}>
          <Upload 
            className={cn(
              "text-primary", 
              isMobile ? "h-5 w-5" : "h-6 w-6"
            )} 
          />
        </div>
        
        <div>
          <p className={cn(
            "font-medium",
            isMobile ? "text-sm" : "text-base"
          )}>
            {isDragActive ? "Drop files here" : description}
          </p>
          <p className={cn(
            "text-muted-foreground mt-1",
            isMobile ? "text-xs" : "text-sm"
          )}>
            Max {maxFiles} files, up to {Math.round(maxSize / (1024 * 1024))}MB each
          </p>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Webhook notification area */}
      {webhookNotifications.length > 0 && (
        <div className="space-y-2">
          {webhookNotifications.map(notification => (
            <Alert 
              key={notification.id} 
              variant={notification.type === 'success' ? 'default' : 'destructive'}
              className="animate-fadeIn"
            >
              <Info className="h-4 w-4" />
              <AlertTitle>Notification</AlertTitle>
              <AlertDescription>{notification.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      
      {/* Files to upload */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Files to upload ({files.length})</h4>
          <ul className="divide-y rounded-md border">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-3 truncate">
                  <div className="rounded-full bg-primary/10 p-1.5">
                    <ImageIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
          
          <div className="flex justify-end">
            <Button
              onClick={uploadFiles}
              disabled={uploadStatus === FileUploadStatus.UPLOADING}
              className="mt-2"
            >
              {uploadStatus === FileUploadStatus.UPLOADING ? 'Uploading...' : 'Upload Files'}
            </Button>
          </div>
        </div>
      )}
      
      {/* Upload progress */}
      {uploadStatus === FileUploadStatus.UPLOADING && Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Upload Progress</h4>
          {Object.entries(uploadProgress).map(([fileId, progress]) => {
            const file = files.find(f => `${f.name}-${Date.now()}`.startsWith(fileId.split('-')[0]));
            return (
              <div key={fileId} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs">{file?.name || 'File'}</p>
                  <p className="text-xs font-medium">{progress}%</p>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            );
          })}
        </div>
      )}
      
      {/* Already uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</h4>
          <ul className="divide-y rounded-md border">
            {uploadedFiles.map((file, index) => (
              <li key={index} className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-3 truncate">
                  <div className="rounded-full bg-green-100 p-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Tooltip>
                      <Tooltip.Trigger asChild>
                        <p className="truncate text-sm font-medium">{file.name}</p>
                      </Tooltip.Trigger>
                      <Tooltip.Content>
                        <p className="text-xs">{file.url}</p>
                        {file.isCloudinary && <p className="text-xs text-green-600">✓ Cloudinary URL</p>}
                      </Tooltip.Content>
                    </Tooltip>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;