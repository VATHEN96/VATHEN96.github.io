import React, { useState, useEffect } from 'react';

interface ActivityFeedProps {
  userId: string;
  limit?: number;
}

interface Activity {
  id: string;
  type: 'contribution' | 'comment' | 'question' | 'vote' | 'create';
  targetId: string;
  targetName: string;
  timestamp: string;
  amount?: number;
}

export default function ActivityFeed({ userId, limit = 5 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        // Return empty array instead of mock activities
        console.log('No activity feed data available for user:', userId);
        setActivities([]);
      } catch (error) {
        console.error('Error fetching activity feed:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [userId, limit]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
} 