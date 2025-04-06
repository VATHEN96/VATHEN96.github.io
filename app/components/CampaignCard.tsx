"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  Bookmark,
  BookmarkCheck
} from "lucide-react";

interface CampaignCardProps {
  id: number;
  title: string;
  description: string;
  target: string;
  deadline: string;
  amountCollected: string;
  image?: string;
  owner: string;
  category?: string;
  donators?: string[];
}

export default function CampaignCard({ 
  id, 
  title, 
  description, 
  target, 
  deadline, 
  amountCollected, 
  image, 
  owner,
  category,
  donators 
}: CampaignCardProps) {
  const [isFollowed, setIsFollowed] = useState(false);

  // Calculate progress percentage
  const calculateProgress = () => {
    const targetValue = parseFloat(target);
    const amountCollectedValue = parseFloat(amountCollected);
    
    if (targetValue === 0) return 0;
    return Math.min((amountCollectedValue / targetValue) * 100, 100);
  };

  // Calculate days remaining
  const calculateDaysRemaining = () => {
    const deadlineDate = new Date(deadline);
    const currentDate = new Date();
    
    const differenceInMs = deadlineDate.getTime() - currentDate.getTime();
    const differenceInDays = Math.ceil(differenceInMs / (1000 * 60 * 60 * 24));
    
    return Math.max(0, differenceInDays);
  };

  // Format description to limit length
  const formatDescription = (desc: string) => {
    return desc.length > 120 ? desc.substring(0, 120) + "..." : desc;
  };

  const toggleFollow = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to campaign details
    e.stopPropagation(); // Stop event bubbling
    setIsFollowed(!isFollowed);
  };

  return (
    <Link href={`/campaign/${id}`}>
      <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg overflow-hidden h-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
        {/* Campaign Image */}
        <div className="relative h-48 overflow-hidden">
          {image ? (
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No image</p>
            </div>
          )}
          
          {/* Category badge */}
          {category && (
            <span className="absolute top-3 left-3 bg-white dark:bg-black text-black dark:text-white text-xs font-semibold px-2 py-1 rounded-full border border-black dark:border-white">
              {category}
            </span>
          )}
          
          {/* Follow button */}
          <button 
            onClick={toggleFollow}
            className="absolute top-3 right-3 bg-white dark:bg-black text-black dark:text-white p-1.5 rounded-full border border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isFollowed ? (
              <BookmarkCheck className="h-5 w-5 text-green-500" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </button>
        </div>
        
        {/* Campaign Content */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-black dark:text-white mb-2 line-clamp-2">{title}</h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {formatDescription(description)}
          </p>
          
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-black dark:text-white">
              <span>{amountCollected} TLOS raised</span>
              <span>Goal: {target} TLOS</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500 dark:text-gray-400">
                {calculateProgress().toFixed(1)}% funded
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {donators?.length || 0} supporters
              </span>
            </div>
          </div>
          
          {/* Campaign details */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-300">
                {calculateDaysRemaining()} days left
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span className="text-gray-600 dark:text-gray-300">
                {new Date(deadline).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
} 