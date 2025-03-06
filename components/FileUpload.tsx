'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check, Image, File as FileIcon } from 'lucide-react';
import { Button } from './ui/button';

interface FileUploadProps {
    onUploadComplete?: (urls: string[]) => void;
    maxFiles?: number;
    acceptedFileTypes?: string[];
}

export default function FileUpload({
    onUploadComplete,
    maxFiles = 1,
    acceptedFileTypes = [
        'image/*',          // All image formats (JPEG, PNG, GIF, SVG, etc.)
        'video/*',          // All video formats (MP4, MOV, AVI, etc.)
        '.pdf',             // PDF documents
        '.doc', '.docx',    // Microsoft Word documents
        '.txt',             // Text files
        '.srt',             // Subtitle files
        '.csv',             // CSV files
        '.xls', '.xlsx',    // Excel files
        '.ppt', '.pptx',    // PowerPoint files
        '.zip', '.rar',     // Archive files (may require Cloudinary account settings)
        '.json', '.xml'     // Data files
    ]
}: FileUploadProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [uploadedFiles, setUploadedFiles] = useState<{url: string, name: string}[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);

    // Convert acceptedFileTypes array to an object format that react-dropzone expects
    const getAcceptedTypes = useCallback(() => {
        return acceptedFileTypes.reduce((acc: Record<string, string[]>, type) => {
            if (type.startsWith('.')) {
                // If it's a file extension, map it to the appropriate MIME type
                const mimeType = {
                    '.pdf': 'application/pdf',
                    '.doc': 'application/msword',
                    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    '.txt': 'text/plain',
                    '.srt': 'application/x-subrip',
                    '.csv': 'text/csv',
                    '.xls': 'application/vnd.ms-excel',
                    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    '.ppt': 'application/vnd.ms-powerpoint',
                    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    '.zip': 'application/zip',
                    '.rar': 'application/x-rar-compressed',
                    '.json': 'application/json',
                    '.xml': 'application/xml'
                }[type];
                if (mimeType) {
                    acc[mimeType] = [type];
                }
            } else {
                // If it's a MIME type pattern (e.g., 'image/*'), use it directly
                acc[type] = [];
            }
            return acc;
        }, {});
    }, [acceptedFileTypes]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles].slice(0, maxFiles));
        setError(null);
        // Automatically trigger upload when files are dropped
        if (acceptedFiles.length > 0) {
            uploadFiles(acceptedFiles);
        }
    }, [maxFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles,
        accept: getAcceptedTypes(),
        onDropRejected: (fileRejections) => {
            const errors = fileRejections.map(rejection => 
                `${rejection.file.name}: ${rejection.errors[0].message}`
            ).join('\n');
            setError(`Invalid file(s):\n${errors}`);
        }
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeUploadedFile = (index: number) => {
        const newUploadedFiles = [...uploadedFiles];
        newUploadedFiles.splice(index, 1);
        setUploadedFiles(newUploadedFiles);
        
        // Also update the parent component
        onUploadComplete?.(newUploadedFiles.map(f => f.url));
    };

    const uploadFiles = async (filesToUpload = files) => {
        if (filesToUpload.length === 0) {
            console.log('No files to upload');
            return;
        }

        setUploading(true);
        setError(null);
        setProgress(0);
        setShowSuccess(false);

        try {
            console.log('Starting file upload process for', filesToUpload.length, 'files');
            const uploadPromises = filesToUpload.map(async (file, index) => {
                const formData = new FormData();
                formData.append('file', file);
                console.log(`Uploading file ${index + 1}/${filesToUpload.length}: ${file.name}`);

                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`Upload failed for ${file.name}:`, errorText);
                        throw new Error(`Upload failed for ${file.name}: ${errorText}`);
                    }

                    const data = await response.json();
                    console.log(`Successfully uploaded ${file.name}:`, data.url);
                    setProgress((prev) => prev + (100 / filesToUpload.length));
                    return { url: data.url, name: file.name };
                } catch (uploadError) {
                    console.error(`Error uploading ${file.name}:`, uploadError);
                    throw new Error(`Failed to upload ${file.name}. Please check your internet connection and try again.`);
                }
            });

            const uploadedResults = await Promise.all(uploadPromises);
            console.log('All files uploaded successfully:', uploadedResults);
            
            // Store uploaded files info
            setUploadedFiles(prev => [...prev, ...uploadedResults]);
            
            // Always pass an array of URLs to the parent component
            const allUrls = [...uploadedFiles, ...uploadedResults].map(f => f.url);
            onUploadComplete?.(allUrls);
            
            // Clear files state and show success
            setFiles([]);
            setProgress(100);
            setShowSuccess(true);
            
            // Hide success message after 3 seconds
            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to upload file(s). Please check your internet connection and try again.';
            console.error('Upload error:', err);
            setError(errorMessage);
            setProgress(0);
        } finally {
            setUploading(false);
        }
    };

    // Helper to display a file icon based on mime type
    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension || '')) {
            return <Image className="h-5 w-5 text-blue-500" />;
        }
        return <FileIcon className="h-5 w-5 text-gray-500" />;
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-purple-500 bg-purple-50/10' : 'border-gray-300 hover:border-purple-500'
                }`}
            >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                    {isDragActive
                        ? 'Drop the files here...'
                        : 'Drag & drop files here, or click to select files'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                    Supported files: Images (PNG, JPG, GIF, SVG), Videos (MP4, MOV, AVI), Documents (PDF, DOC, DOCX, TXT), Spreadsheets (CSV, XLS, XLSX), Presentations (PPT, PPTX), Archives (ZIP, RAR), Data files (JSON, XML) and more (up to 10MB)
                </p>
            </div>

            {showSuccess && (
                <div className="mt-2 flex items-center p-2 bg-green-100 text-green-700 rounded-md">
                    <Check className="h-5 w-5 mr-2" />
                    <span>Files uploaded successfully!</span>
                </div>
            )}

            {/* Display files to be uploaded */}
            {files.length > 0 && (
                <div className="mt-4 space-y-4">
                    <h3 className="text-sm font-medium">Files to upload:</h3>
                    {files.map((file, index) => (
                        <div
                            key={`to-upload-${index}`}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                            <div className="flex items-center space-x-3">
                                {getFileIcon(file.name)}
                                <span className="text-sm text-gray-500">
                                    {file.name}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    ))}

                    <div className="flex justify-end space-x-3">
                        <Button
                            onClick={() => setFiles([])}
                            variant="outline"
                            disabled={uploading}
                        >
                            Clear All
                        </Button>
                        <Button
                            onClick={() => uploadFiles()}
                            disabled={uploading}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </div>

                    {uploading && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Display already uploaded files */}
            {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-4">
                    <h3 className="text-sm font-medium">Uploaded files:</h3>
                    {uploadedFiles.map((file, index) => (
                        <div
                            key={`uploaded-${index}`}
                            className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                        >
                            <div className="flex items-center space-x-3">
                                {getFileIcon(file.name)}
                                <span className="text-sm text-gray-700">
                                    {file.name}
                                </span>
                                <span className="text-xs text-green-600 flex items-center">
                                    <Check className="h-3 w-3 mr-1" /> Uploaded
                                </span>
                            </div>
                            <button
                                onClick={() => removeUploadedFile(index)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <p className="text-sm text-red-500 mt-2 whitespace-pre-line">{error}</p>
            )}
        </div>
    );
}