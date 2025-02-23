'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { Button } from './ui/button';

interface FileUploadProps {
    onUploadComplete?: (urls: string | string[]) => void;
    maxFiles?: number;
    acceptedFileTypes?: string[];
}

export default function FileUpload({
    onUploadComplete,
    maxFiles = 1,
    acceptedFileTypes = ['image/*', 'video/*', 'application/pdf', '.doc,.docx,.txt']
}: FileUploadProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles].slice(0, maxFiles));
        setError(null);
    }, [maxFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles,
        accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadFiles = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setError(null);
        setProgress(0);

        try {
            const uploadPromises = files.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);

                try {
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `Upload failed with status: ${response.status}`);
                    }

                    const data = await response.json();
                    setProgress((prev) => Math.min(prev + (100 / files.length), 99));
                    return data.url;
                } catch (uploadError) {
                    throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                }
            });

            const urls = await Promise.all(uploadPromises);
            onUploadComplete?.(urls.length === 1 ? urls[0] : urls);
            setFiles([]);
            setProgress(100);
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to upload file(s). Please try again.';
            setError(errorMessage);
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
        }
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
                    Supported files: Images, Videos, and Documents (PDF, DOC, DOCX, TXT)
                </p>
            </div>

            {files.length > 0 && (
                <div className="mt-4 space-y-4">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                            <div className="flex items-center space-x-3">
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
                            onClick={uploadFiles}
                            disabled={uploading}
                            className="bg-purple-600 hover:bg-purple-700"
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

                    {error && (
                        <p className="text-sm text-red-500 mt-2">{error}</p>
                    )}
                </div>
            )}
        </div>
    );
}