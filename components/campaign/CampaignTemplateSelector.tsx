'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Rocket, 
  Code, 
  Lightbulb, 
  PiggyBank, 
  Paintbrush, 
  Music, 
  BookOpen, 
  FilmIcon,
  Coffee
} from 'lucide-react';

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  defaultValues: {
    title: string;
    description: string;
    category: number;
    duration: number;
    minGoalAmount: number;
    suggestedMilestones: Array<{
      name: string;
      description: string;
      percentage: number;
      dueDate?: number;
    }>;
    campaignType: number;
  };
  tips: string[];
}

export const campaignTemplates: CampaignTemplate[] = [
  {
    id: 'tech-startup',
    name: 'Tech Startup',
    description: 'For software, apps, and technology innovation projects',
    icon: <Code size={24} />,
    defaultValues: {
      title: 'Innovative Tech Solution',
      description: "We're building a revolutionary technology solution that addresses [specific problem].",
      category: 0, // Technology
      duration: 45,
      minGoalAmount: 5,
      suggestedMilestones: [
        {
          name: 'Proof of Concept',
          description: 'Complete initial prototype demonstrating core functionality',
          percentage: 20
        },
        {
          name: 'Alpha Release',
          description: 'First working version with basic features',
          percentage: 30
        },
        {
          name: 'Beta Launch',
          description: 'Public beta with complete feature set and bug fixes',
          percentage: 30
        },
        {
          name: 'Full Launch',
          description: 'Final version with complete documentation and support',
          percentage: 20
        }
      ],
      campaignType: 1 // Investment
    },
    tips: [
      'Include technical details without overwhelming non-technical readers',
      'Explain the market problem clearly before introducing your solution',
      'Include a roadmap with realistic timeframes for each development phase',
      'Address potential technical challenges and your mitigation strategies'
    ]
  },
  {
    id: 'product-design',
    name: 'Product Design',
    description: 'For physical products, gadgets, and hardware projects',
    icon: <Lightbulb size={24} />,
    defaultValues: {
      title: 'Innovative Product Design',
      description: "We're creating a new product that solves [specific problem] through innovative design.",
      category: 1, // Product Design
      duration: 60,
      minGoalAmount: 10,
      suggestedMilestones: [
        {
          name: 'Design Phase',
          description: 'Complete final product designs and prototypes',
          percentage: 20
        },
        {
          name: 'Manufacturing Setup',
          description: 'Secure manufacturing partners and begin production setup',
          percentage: 30
        },
        {
          name: 'Production Run',
          description: 'Complete initial production run with quality testing',
          percentage: 30
        },
        {
          name: 'Delivery',
          description: 'Ship products to backers with documentation',
          percentage: 20
        }
      ],
      campaignType: 0 // Donation
    },
    tips: [
      'Include high-quality renderings or prototypes of your product',
      'Detail the materials and manufacturing process',
      'Explain your production timeline realistically, including potential delays',
      'Create a clear pricing structure and delivery timeline'
    ]
  },
  {
    id: 'creative-project',
    name: 'Creative Project',
    description: 'For art, music, film, and other creative endeavors',
    icon: <Paintbrush size={24} />,
    defaultValues: {
      title: 'Creative Arts Project',
      description: "We're creating a [film/album/art installation] that explores [theme/concept].",
      category: 2, // Creative Arts
      duration: 30,
      minGoalAmount: 2,
      suggestedMilestones: [
        {
          name: 'Pre-production',
          description: 'Complete planning, storyboarding, and initial preparation',
          percentage: 25
        },
        {
          name: 'Production',
          description: 'Complete primary creation/recording/filming phase',
          percentage: 50
        },
        {
          name: 'Post-production',
          description: 'Complete editing, mixing, and finalization',
          percentage: 25
        }
      ],
      campaignType: 0 // Donation
    },
    tips: [
      'Share samples of your previous work to establish credibility',
      'Create a compelling story around your creative vision',
      'Explain how funds will be used in detail',
      'Offer meaningful rewards for different contribution levels'
    ]
  },
  {
    id: 'community-project',
    name: 'Community Project',
    description: 'For social impact, community spaces, and local initiatives',
    icon: <PiggyBank size={24} />,
    defaultValues: {
      title: 'Community Impact Initiative',
      description: "We're creating a project that will benefit our community by [specific impact].",
      category: 3, // Community
      duration: 90,
      minGoalAmount: 3,
      suggestedMilestones: [
        {
          name: 'Planning & Approvals',
          description: 'Complete planning and secure necessary approvals',
          percentage: 20
        },
        {
          name: 'Initial Implementation',
          description: 'Begin implementation of the core project elements',
          percentage: 40
        },
        {
          name: 'Project Completion',
          description: 'Complete all project elements and prepare for launch',
          percentage: 30
        },
        {
          name: 'Community Launch',
          description: 'Official launch with community engagement events',
          percentage: 10
        }
      ],
      campaignType: 0 // Donation
    },
    tips: [
      'Clearly explain the community need your project addresses',
      'Include testimonials or support from community members',
      'Provide specific impact metrics you plan to achieve',
      'Detail how the community will be involved in the project'
    ]
  },
  {
    id: 'custom',
    name: 'Custom Campaign',
    description: 'Create a completely custom campaign from scratch',
    icon: <Rocket size={24} />,
    defaultValues: {
      title: '',
      description: '',
      category: 0,
      duration: 30,
      minGoalAmount: 1,
      suggestedMilestones: [
        {
          name: 'Initial Milestone',
          description: 'Complete the first phase of the project',
          percentage: 33
        },
        {
          name: 'Midpoint Milestone',
          description: 'Complete the middle phase of the project',
          percentage: 33
        },
        {
          name: 'Final Milestone',
          description: 'Complete the final phase of the project',
          percentage: 34
        }
      ],
      campaignType: 0 // Donation
    },
    tips: [
      'Be specific about your project goals and timeline',
      'Include a detailed budget breakdown',
      'Set realistic milestones with clear deliverables',
      'Explain why your project matters and deserves support'
    ]
  }
];

interface CampaignTemplateSelectorProps {
  onSelect: (template: CampaignTemplate) => void;
}

export default function CampaignTemplateSelector({ onSelect }: CampaignTemplateSelectorProps) {
  // Add debugging console logs
  console.log('Campaign Templates:', campaignTemplates);
  
  // Helper function to safely get milestone count
  const getMilestoneCount = (template: CampaignTemplate): number => {
    try {
      if (template && template.defaultValues && Array.isArray(template.defaultValues.suggestedMilestones)) {
        return template.defaultValues.suggestedMilestones.length;
      }
      return 0;
    } catch (error) {
      console.error(`Error getting milestone count for template ${template?.id}:`, error);
      return 0;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose a Campaign Template</h2>
        <p className="text-gray-600">
          Start with a template designed for your campaign type to get recommended structures,
          milestones, and best practices.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaignTemplates.map((template) => {
          console.log(`Template ${template.id}:`, template);
          console.log(`Template ${template.id} defaultValues:`, template.defaultValues);
          console.log(`Template ${template.id} suggestedMilestones:`, template.defaultValues?.suggestedMilestones);
          
          return (
            <Card 
              key={template.id} 
              className="cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => onSelect(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-blue-100 p-2 rounded-md">
                    {template.icon}
                  </div>
                  {template.id === 'custom' && (
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                      Blank Canvas
                    </span>
                  )}
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-gray-500">
                  {template.id === 'custom' 
                    ? 'Start with a blank canvas and build your campaign exactly as you want it.' 
                    : `Includes ${getMilestoneCount(template)} suggested milestones and industry-specific tips.`}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Select Template
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 