'use client';

import React, { useState, useEffect } from 'react';
import { useWowzaRush } from '@/context/wowzarushContext';
import { CampaignUpdate } from '@/services/NotificationService';
import { format } from 'date-fns';
import { FilePlus, PinIcon, Eye, EyeOff, MessageSquare, Heart, Edit, Trash, Image, FileText, FileVideo } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Form validation schema
const updateFormSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters' }).max(100, { message: 'Title must be less than 100 characters' }),
  content: z.string().min(20, { message: 'Content must be at least 20 characters' }),
  isPublic: z.boolean().default(true),
  isPinned: z.boolean().default(false),
  attachments: z.array(
    z.object({
      type: z.enum(['image', 'video', 'document']),
      url: z.string().url({ message: 'Please enter a valid URL' }),
      name: z.string(),
    })
  ).optional(),
});

interface CampaignUpdatesProps {
  campaignId: string;
  isCreator?: boolean;
}

export function CampaignUpdates({ campaignId, isCreator = false }: CampaignUpdatesProps) {
  const { 
    account, 
    isWalletConnected,
    getCampaignUpdates,
    createCampaignUpdate,
    updateCampaignUpdate,
    deleteCampaignUpdate
  } = useWowzaRush();
  
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrivateUpdates, setShowPrivateUpdates] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<CampaignUpdate | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof updateFormSchema>>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      title: '',
      content: '',
      isPublic: true,
      isPinned: false,
      attachments: [],
    },
  });
  
  // Load updates when component mounts
  useEffect(() => {
    if (campaignId) {
      loadUpdates();
    }
  }, [campaignId, showPrivateUpdates]);
  
  // Set form values when editing an update
  useEffect(() => {
    if (editingUpdate) {
      form.reset({
        title: editingUpdate.title,
        content: editingUpdate.content,
        isPublic: editingUpdate.isPublic,
        isPinned: editingUpdate.isPinned,
        attachments: editingUpdate.attachments || [],
      });
      
      setOpenCreateDialog(true);
    }
  }, [editingUpdate, form]);
  
  const loadUpdates = async () => {
    setLoading(true);
    try {
      const result = await getCampaignUpdates(campaignId, isCreator && showPrivateUpdates);
      setUpdates(result);
    } catch (error) {
      console.error(`Error loading updates for campaign ${campaignId}:`, error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateUpdate = async (data: z.infer<typeof updateFormSchema>) => {
    try {
      const updateData = {
        campaignId,
        title: data.title,
        content: data.content,
        isPublic: data.isPublic,
        isPinned: data.isPinned,
        attachments: data.attachments,
      };
      
      if (editingUpdate) {
        // Update existing update
        const success = await updateCampaignUpdate(editingUpdate.id, updateData);
        
        if (success) {
          setUpdates(current => 
            current.map(update => 
              update.id === editingUpdate.id 
                ? { ...update, ...updateData }
                : update
            )
          );
          
          toast.success('Update edited successfully!');
        }
      } else {
        // Create new update
        const newUpdate = await createCampaignUpdate(updateData);
        
        if (newUpdate) {
          setUpdates(current => [newUpdate, ...current]);
          toast.success('Update published successfully!');
        }
      }
      
      // Reset form and close dialog
      form.reset();
      setOpenCreateDialog(false);
      setEditingUpdate(null);
    } catch (error) {
      console.error('Error creating/updating campaign update:', error);
      toast.error('Failed to publish update');
    }
  };
  
  const handleDeleteUpdate = async () => {
    if (!updateToDelete) return;
    
    try {
      const success = await deleteCampaignUpdate(updateToDelete);
      
      if (success) {
        setUpdates(current => current.filter(update => update.id !== updateToDelete));
        toast.success('Update deleted successfully!');
      }
    } catch (error) {
      console.error(`Error deleting update ${updateToDelete}:`, error);
      toast.error('Failed to delete update');
    } finally {
      setUpdateToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };
  
  const confirmDeleteUpdate = (updateId: string) => {
    setUpdateToDelete(updateId);
    setDeleteConfirmOpen(true);
  };
  
  const handleEditUpdate = (update: CampaignUpdate) => {
    setEditingUpdate(update);
  };
  
  const handleTogglePin = async (update: CampaignUpdate) => {
    try {
      const success = await updateCampaignUpdate(update.id, { isPinned: !update.isPinned });
      
      if (success) {
        setUpdates(current => 
          current.map(u => 
            u.id === update.id 
              ? { ...u, isPinned: !u.isPinned }
              : u
          )
        );
        
        toast.success(`Update ${update.isPinned ? 'unpinned' : 'pinned'} successfully!`);
      }
    } catch (error) {
      console.error(`Error toggling pin status for update ${update.id}:`, error);
      toast.error('Failed to update pin status');
    }
  };
  
  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <FileVideo className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  // Create a sorted list of updates with pinned ones first
  const sortedUpdates = [...updates].sort((a, b) => {
    // First sort by pinned status
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Then sort by date (newest first)
    return b.createdAt - a.createdAt;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Campaign Updates</h2>
          <p className="text-muted-foreground">Stay informed about the latest progress</p>
        </div>
        
        <div className="flex items-center gap-2">
          {isCreator && (
            <Button
              onClick={() => {
                form.reset();
                setEditingUpdate(null);
                setOpenCreateDialog(true);
              }}
            >
              <FilePlus className="mr-2 h-4 w-4" />
              Post Update
            </Button>
          )}
          
          {isCreator && (
            <Button
              variant="outline"
              onClick={() => setShowPrivateUpdates(!showPrivateUpdates)}
            >
              {showPrivateUpdates ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
              {showPrivateUpdates ? 'Show All' : 'Show Private Updates'}
            </Button>
          )}
        </div>
      </div>
      
      {/* Create/Edit Update Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingUpdate ? 'Edit Update' : 'Post Campaign Update'}</DialogTitle>
            <DialogDescription>
              {editingUpdate 
                ? 'Edit your update to keep backers informed about your progress.'
                : 'Share your progress and keep your backers informed.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateUpdate)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Update title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Share your progress with backers..." 
                        className="min-h-[200px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel>Public Update</FormLabel>
                        <FormDescription>
                          Make this update visible to everyone
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isPinned"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel>Pin Update</FormLabel>
                        <FormDescription>
                          Keep this update at the top
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              {/* We could add attachment functionality here */}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    form.reset();
                    setOpenCreateDialog(false);
                    setEditingUpdate(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">{editingUpdate ? 'Save Changes' : 'Publish Update'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the update
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUpdate}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Updates List */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedUpdates.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Updates Yet</CardTitle>
            <CardDescription>
              {isCreator 
                ? 'Post your first update to keep your backers informed about your progress.'
                : 'The creator has not posted any updates yet.'}
            </CardDescription>
          </CardHeader>
          {isCreator && (
            <CardFooter>
              <Button onClick={() => setOpenCreateDialog(true)}>
                <FilePlus className="mr-2 h-4 w-4" />
                Post First Update
              </Button>
            </CardFooter>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedUpdates.map((update) => (
            <Card key={update.id} className={update.isPublic ? '' : 'border-dashed border-amber-500'}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {update.title}
                      {update.isPinned && (
                        <PinIcon className="h-4 w-4 text-amber-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {format(new Date(update.createdAt), 'MMMM d, yyyy')}
                      {!update.isPublic && (
                        <Badge variant="outline" className="text-amber-500 border-amber-500">
                          Backer-only
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  
                  {isCreator && (
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleTogglePin(update)}
                        title={update.isPinned ? 'Unpin update' : 'Pin update'}
                      >
                        <PinIcon className={`h-4 w-4 ${update.isPinned ? 'text-amber-500' : ''}`} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditUpdate(update)}
                        title="Edit update"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => confirmDeleteUpdate(update.id)}
                        title="Delete update"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {update.content.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
                
                {update.attachments && update.attachments.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {update.attachments.map((attachment, index) => (
                      <a 
                        key={index} 
                        href={attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center p-2 border rounded-md hover:bg-muted transition-colors"
                      >
                        {getAttachmentIcon(attachment.type)}
                        <span className="ml-2 text-sm truncate">{attachment.name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-muted-foreground">
                    <Heart className="h-4 w-4 mr-1" />
                    <span className="text-sm">{update.likes}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    <span className="text-sm">{update.comments}</span>
                  </div>
                </div>
                
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Comment
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 