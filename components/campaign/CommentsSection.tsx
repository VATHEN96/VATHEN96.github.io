import React, { useState, useEffect } from 'react';
import { useWowzaRush, Comment } from '@/context/wowzarushContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, ThumbsUp, MessageCircle, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface CommentsSectionProps {
  campaignId: string;
  creatorId?: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ campaignId, creatorId }) => {
  const { account, isWalletConnected, getComments, addComment, likeComment, reportComment, getCreatorProfile } = useWowzaRush();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const isCreator = account?.toLowerCase() === creatorId?.toLowerCase();

  // Load comments from context
  useEffect(() => {
    const loadComments = async () => {
      setIsLoading(true);
      try {
        const commentsData = await getComments(campaignId);
        
        // If we have comments from the context, use them
        if (commentsData && commentsData.length > 0) {
          setComments(commentsData);
        } else {
          // Otherwise use the mock data (just for demonstration)
          const mockComments: Comment[] = [
            {
              id: '1',
              campaignId,
              userId: '0x1234567890abcdef1234567890abcdef12345678',
              content: 'This project looks amazing! I love the concept and the team seems very capable. Looking forward to seeing how it develops.',
              timestamp: Date.now() - 3600000 * 24 * 2, // 2 days ago
              likes: 5,
              isCreator: false,
              replies: [
                {
                  id: '1-1',
                  parentId: '1',
                  userId: creatorId || '0xcreator0000000000000000000000000000',
                  content: 'Thank you for your support! We are working hard to deliver on our promises.',
                  timestamp: Date.now() - 3600000 * 24, // 1 day ago
                  likes: 2,
                  isCreator: true
                }
              ]
            },
            {
              id: '2',
              campaignId,
              userId: '0xabcdef1234567890abcdef1234567890abcdef12',
              content: 'I have a question about the roadmap. When do you plan to release the beta version?',
              timestamp: Date.now() - 3600000 * 36, // 36 hours ago
              likes: 3,
              isCreator: false,
              replies: []
            },
            {
              id: '3',
              campaignId,
              userId: creatorId,
              content: 'We just hit our first milestone! Thanks to all our supporters for making this possible. Stay tuned for more updates!',
              timestamp: Date.now() - 3600000 * 48, // 48 hours ago
              likes: 10,
              isCreator: true,
              replies: []
            }
          ];
          
          setComments(mockComments);
        }
      } catch (error) {
        console.error('Error loading comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setIsLoading(false);
      }
    };
    
    const loadUserProfile = async () => {
      if (account) {
        try {
          const profile = await getCreatorProfile(account);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
    };
    
    loadComments();
    loadUserProfile();
  }, [campaignId, account, getComments, getCreatorProfile, creatorId]);

  const handleCommentSubmit = async () => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet to comment');
      return;
    }
    
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Use the context function to add a comment
      const comment = await addComment(campaignId, newComment);
      
      // Update the UI with the new comment
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet to reply');
      return;
    }
    
    if (!replyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Use the context function to add a reply
      const reply = await addComment(campaignId, replyContent, commentId);
      
      // Update the UI with the new reply
      setComments(prev => {
        return prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), reply]
            };
          }
          return comment;
        });
      });
      
      setReplyContent('');
      setReplyingTo(null);
      toast.success('Reply posted successfully');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet to like comments');
      return;
    }
    
    try {
      // Use the context function to like a comment
      await likeComment(commentId);
      
      // Update the UI to reflect the like
      setComments(prev => {
        return prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes: comment.likes + 1
            };
          }
          
          // Check if the comment is in replies
          if (comment.replies) {
            const updatedReplies = comment.replies.map(reply => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  likes: reply.likes + 1
                };
              }
              return reply;
            });
            
            return {
              ...comment,
              replies: updatedReplies
            };
          }
          
          return comment;
        });
      });
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const handleReport = async (commentId: string) => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet to report comments');
      return;
    }
    
    try {
      // Use the context function to report a comment
      await reportComment(commentId);
      toast.success('Comment reported. Thank you for helping keep our community safe.');
    } catch (error) {
      console.error('Error reporting comment:', error);
      toast.error('Failed to report comment');
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    return (
      <div key={comment.id} className={`${isReply ? 'ml-12 mt-4' : 'mb-6'}`}>
        <div className="flex gap-4">
          <Link href={`/profile/view?address=${comment.userId}`}>
            <Avatar className="h-10 w-10">
              <AvatarFallback>{comment.userId.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/profile/view?address=${comment.userId}`} className="font-semibold hover:underline">
                User {comment.userId.substring(0, 6)}...
              </Link>
              
              {comment.isCreator && (
                <Badge className="bg-purple-500 hover:bg-purple-600">Creator</Badge>
              )}
              
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
              </span>
            </div>
            
            <p className="mt-2 text-gray-700">{comment.content}</p>
            
            <div className="flex items-center mt-3 gap-4">
              <Button variant="ghost" size="sm" onClick={() => handleLike(comment.id)}>
                <ThumbsUp className="h-4 w-4 mr-1" />
                {comment.likes}
              </Button>
              
              {!isReply && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Reply
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    •••
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleReport(comment.id)}>
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {replyingTo === comment.id && (
              <div className="mt-4">
                <Textarea
                  placeholder="Write your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="outline" onClick={() => setReplyingTo(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleReplySubmit(comment.id)}
                    disabled={isSubmitting || !replyContent.trim()}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Post Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4 mt-4">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Comments</h3>
      
      {/* Comment form */}
      <Card>
        <CardContent className="pt-6">
          <Textarea
            placeholder={isWalletConnected ? "Share your thoughts about this campaign..." : "Connect your wallet to comment"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
            disabled={!isWalletConnected}
          />
        </CardContent>
        <CardFooter className="justify-between">
          <p className="text-sm text-gray-500">
            {isWalletConnected ? 'Be respectful and constructive in your comments.' : 'Connect your wallet to join the conversation.'}
          </p>
          <Button 
            onClick={handleCommentSubmit}
            disabled={isSubmitting || !newComment.trim() || !isWalletConnected}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Post Comment
          </Button>
        </CardFooter>
      </Card>
      
      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">{comments.length} Comments</h4>
            <Button variant="ghost" size="sm">
              Most Recent
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-6">
            {comments.map(comment => renderComment(comment))}
          </div>
        </div>
      )}
    </div>
  );
}; 