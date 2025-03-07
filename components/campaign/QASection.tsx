import React, { useState, useEffect } from 'react';
import { useWowzaRush } from '@/context/wowzarushContext';
import type { Question } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, MessageCircle, CheckCircle2, ThumbsUp, Search, Filter, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

interface QASectionProps {
  campaignId: string;
  creatorId: string;
}

const QASection: React.FC<QASectionProps> = ({ campaignId, creatorId }) => {
  const { account, isWalletConnected, getCreatorProfile, getQuestions, addQuestion, answerQuestion, likeQuestion } = useWowzaRush();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [newQuestionTags, setNewQuestionTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'answered', 'unanswered'
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);

  const isCreator = account?.toLowerCase() === creatorId?.toLowerCase();

  // Load questions from context
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      try {
        const questionsData = await getQuestions(campaignId);
        
        // If we have questions from the context, use them
        if (questionsData && questionsData.length > 0) {
          setQuestions(questionsData);
          setFilteredQuestions(questionsData);
        } else {
          // Otherwise use the mock data (just for demonstration)
          const mockQuestions: Question[] = [
            {
              id: '1',
              campaignId,
              title: 'When will the first milestone be completed?',
              content: 'I\'m interested in knowing the timeline for the first milestone. Can you provide more details?',
              createdAt: Date.now() - 86400000 * 3, // 3 days ago
              creatorAddress: '0x1234567890abcdef1234567890abcdef12345678',
              creatorName: 'User1',
              isAnswered: true,
              isPinned: true,
              answerCount: 1,
              upvotes: 5,
              tags: ['timeline', 'milestones'],
              bestAnswerId: '101'
            },
            {
              id: '2',
              campaignId,
              userId: '0xabcdef1234567890abcdef1234567890abcdef12',
              title: 'Security Audits',
              content: 'Have your smart contracts been audited? If yes, by which firm? If not, do you plan to have them audited before launch?',
              timestamp: Date.now() - 3600000 * 12, // 12 hours ago
              likes: 8,
              isAnswered: false,
              tags: ['security', 'smart contracts', 'audit']
            },
            {
              id: '3',
              campaignId,
              userId: '0x0987654321fedcba0987654321fedcba09876543',
              title: 'Token Distribution',
              content: 'Could you share more details about the token distribution? What percentage is allocated to the team, investors, and community?',
              timestamp: Date.now() - 3600000 * 36, // 36 hours ago
              likes: 15,
              isAnswered: true,
              answer: {
                userId: creatorId || '0xcreator0000000000000000000000000000',
                content: 'Great question! Our token distribution is as follows: 40% to community and contributors, 30% to the team (vested over 3 years), 20% to investors, and 10% reserved for future development and partnerships.',
                timestamp: Date.now() - 3600000 * 24, // 24 hours ago
                isCreator: true
              },
              tags: ['tokenomics', 'distribution', 'vesting']
            }
          ];
          
          setQuestions(mockQuestions);
          setFilteredQuestions(mockQuestions);
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        toast.error('Failed to load Q&A section');
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
    
    loadQuestions();
    loadUserProfile();
  }, [campaignId, account, getCreatorProfile, creatorId, getQuestions]);

  // Apply filters and search whenever the related states change
  useEffect(() => {
    let result = [...questions];
    
    // Apply filter
    if (filter === 'answered') {
      result = result.filter(q => q.isAnswered);
    } else if (filter === 'unanswered') {
      result = result.filter(q => !q.isAnswered);
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(q => 
        q.title.toLowerCase().includes(query) || 
        q.content.toLowerCase().includes(query) ||
        q.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredQuestions(result);
  }, [questions, filter, searchQuery]);

  const handleQuestionSubmit = async () => {
    if (!newQuestionTitle.trim() || !newQuestionContent.trim()) {
      toast.error('Please provide both a title and content for your question');
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real implementation, this would call the API
      const newQuestion = await addQuestion(
        campaignId,
        newQuestionTitle,
        newQuestionContent
      );

      // Add the new question to the list
      setQuestions(prev => [newQuestion, ...prev]);
      
      // Reset form
      setNewQuestionTitle('');
      setNewQuestionContent('');
      setNewQuestionTags([]);
      setIsAskingQuestion(false);
      
      toast.success('Your question has been submitted');
    } catch (error) {
      console.error('Error submitting question:', error);
      toast.error('Failed to submit your question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerSubmit = async (questionId: string) => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet to answer');
      return;
    }
    
    if (!replyContent.trim()) {
      toast.error('Please enter your answer');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Use the context function to answer a question
      const updatedQuestion = await answerQuestion(questionId, replyContent);
      
      // Update the UI with the updated question
      setQuestions(prev => {
        return prev.map(question => {
          if (question.id === questionId) {
            return updatedQuestion;
          }
          return question;
        });
      });
      
      setReplyContent('');
      setReplyingTo(null);
      toast.success('Answer posted successfully');
    } catch (error) {
      console.error('Error posting answer:', error);
      toast.error('Failed to post answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !newQuestionTags.includes(newTagInput.trim())) {
      setNewQuestionTags(prev => [...prev, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewQuestionTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleLike = async (questionId: string) => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet to like questions');
      return;
    }
    
    try {
      await likeQuestion(questionId);
      
      // Update the UI
      setQuestions(prev => 
        prev.map(question => 
          question.id === questionId 
            ? { ...question, upvotes: question.upvotes + 1 } 
            : question
        )
      );
    } catch (error) {
      console.error('Error liking question:', error);
      toast.error('Failed to like the question');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Questions & Answers</h3>
      
      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter questions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Questions</SelectItem>
            <SelectItem value="answered">Answered</SelectItem>
            <SelectItem value="unanswered">Unanswered</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* New question form */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium mb-4">Ask a question</h4>
          <div className="space-y-3">
            <Input
              placeholder="Title of your question"
              value={newQuestionTitle}
              onChange={(e) => setNewQuestionTitle(e.target.value)}
              disabled={!isWalletConnected}
            />
            <Textarea
              placeholder={isWalletConnected ? "Describe your question in detail..." : "Connect your wallet to ask a question"}
              value={newQuestionContent}
              onChange={(e) => setNewQuestionContent(e.target.value)}
              className="min-h-[100px]"
              disabled={!isWalletConnected}
            />
            
            {/* Tags input */}
            <div>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add tags (optional)"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  disabled={!isWalletConnected}
                />
                <Button variant="outline" onClick={handleAddTag} disabled={!isWalletConnected || !newTagInput.trim()}>
                  Add
                </Button>
              </div>
              
              {newQuestionTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newQuestionTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="px-2 py-1">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="ml-2 text-gray-500 hover:text-gray-700">
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button 
            onClick={handleQuestionSubmit}
            disabled={isSubmitting || !newQuestionTitle.trim() || !newQuestionContent.trim() || !isWalletConnected}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit Question
          </Button>
        </CardFooter>
      </Card>
      
      {/* Questions list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No questions found for this campaign. Be the first to ask!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Showing {filteredQuestions.length} of {questions.length} questions</p>
          <Accordion type="single" collapsible className="space-y-4">
            {filteredQuestions.map((question) => (
              <AccordionItem key={question.id} value={question.id} className="border rounded-lg p-2">
                <AccordionTrigger className="hover:no-underline px-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between w-full text-left">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-lg">{question.title}</h4>
                        {question.isAnswered && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            Solved
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</span>
                        </div>
                        <span>•</span>
                        <Link href={`/profile/view?address=${question.creatorAddress}`} className="hover:underline">
                          User {question.creatorAddress.substring(0, 6)}...
                        </Link>
                        <span>•</span>
                        <div className="flex items-center">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {question.upvotes}
                        </div>
                      </div>
                    </div>
                    
                    {question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                        {question.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="px-2 py-1">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-4 pt-4">
                  <div className="space-y-6">
                    {/* Question content */}
                    <div className="flex gap-3">
                      <Link href={`/profile/view?address=${question.creatorAddress}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${question.creatorAddress}`} />
                          <AvatarFallback>{question.creatorAddress.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Link>
                      
                      <div className="flex-1">
                        <Link href={`/profile/view?address=${question.creatorAddress}`} className="font-semibold hover:underline">
                          User {question.creatorAddress.substring(0, 6)}...
                        </Link>
                        <p className="mt-2 text-gray-700">{question.content}</p>
                        
                        <div className="flex items-center mt-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-500 hover:text-gray-700"
                            onClick={() => handleLike(question.id)}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {question.upvotes}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Answer section - only show if question is answered */}
                    {question.isAnswered && question.bestAnswerId ? (
                      <div className="mt-4 pl-4 border-l-2 border-green-200">
                        <div className="text-sm font-medium text-green-600 mb-2">
                          <CheckCircle2 className="h-4 w-4 inline mr-1" />
                          Answered by Creator
                        </div>
                        <p className="text-gray-700">
                          This question has been answered by the creator. View the full answer in the detailed view.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default QASection; 