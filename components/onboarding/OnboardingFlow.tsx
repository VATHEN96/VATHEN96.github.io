import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getWalletConnector, WalletType } from '../../utils/wallet-connector';

// Types for onboarding steps
type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  action?: () => Promise<void>;
  actionLabel?: string;
  skipLabel?: string;
  isCompleted: boolean;
  isSkippable: boolean;
};

// Create local storage key for onboarding state
const ONBOARDING_STORAGE_KEY = 'wowzarush_onboarding_state';

/**
 * Onboarding Flow Component
 * Guides new users through Web3 concepts and wallet connection
 */
export function OnboardingFlow() {
  // Router for navigation
  const router = useRouter();
  
  // State for current step index
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // State for steps completion
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'Welcome to WowzaRush',
      description: 'We'll guide you through everything you need to get started with Web3 and our application.',
      isCompleted: false,
      isSkippable: true,
    },
    {
      id: 'web3-intro',
      title: 'What is Web3?',
      description: 'Web3 is the decentralized internet built on blockchain technology. Instead of big companies controlling your data, you remain in control through your wallet.',
      isCompleted: false,
      isSkippable: true,
    },
    {
      id: 'wallet-intro',
      title: 'What is a Wallet?',
      description: 'A crypto wallet is your identity in Web3. It allows you to store digital assets, sign transactions, and interact with applications like ours.',
      isCompleted: false,
      isSkippable: true,
    },
    {
      id: 'wallet-selection',
      title: 'Choose a Wallet',
      description: 'To use our application, you need a wallet. You can use an existing one or create a new one.',
      isCompleted: false,
      isSkippable: false,
      actionLabel: 'Connect Wallet',
      action: async () => {
        try {
          const walletConnector = getWalletConnector();
          await walletConnector.connect(WalletType.AUTO);
          return Promise.resolve();
        } catch (error) {
          console.error('Failed to connect wallet', error);
          return Promise.reject(error);
        }
      },
    },
    {
      id: 'network-selection',
      title: 'Choose a Network',
      description: 'Blockchain applications run on different networks. We recommend starting with Ethereum Mainnet or Polygon for lower fees.',
      isCompleted: false,
      isSkippable: true,
      actionLabel: 'Switch Network',
      action: async () => {
        try {
          const walletConnector = getWalletConnector();
          await walletConnector.switchNetwork(137); // Polygon
          return Promise.resolve();
        } catch (error) {
          console.error('Failed to switch network', error);
          return Promise.reject(error);
        }
      },
    },
    {
      id: 'gas-explanation',
      title: 'Understanding Gas Fees',
      description: 'Gas fees are payments made to process transactions on the blockchain. They vary based on network congestion and complexity of your transaction.',
      isCompleted: false,
      isSkippable: true,
    },
    {
      id: 'security-tips',
      title: 'Security Best Practices',
      description: 'Never share your private keys or seed phrase. Be cautious of phishing sites. Always verify contract addresses before approving transactions.',
      isCompleted: false,
      isSkippable: true,
    },
    {
      id: 'app-features',
      title: 'App Features',
      description: 'Our application allows you to create campaigns, transfer assets, and track on-chain activities. Let's take a quick tour.',
      isCompleted: false,
      isSkippable: true,
      actionLabel: 'Start Tour',
      skipLabel: 'Skip Tour',
      action: async () => {
        // Start app tour
        router.push('/dashboard?tour=true');
        return Promise.resolve();
      },
    },
    {
      id: 'complete',
      title: 'You're Ready!',
      description: 'You've completed the onboarding process. You're now ready to use our application to its full potential.',
      isCompleted: false,
      isSkippable: false,
      actionLabel: 'Get Started',
      action: async () => {
        // Complete onboarding and go to dashboard
        completeOnboarding();
        router.push('/dashboard');
        return Promise.resolve();
      },
    },
  ]);
  
  // State for action loading
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // State for action error
  const [actionError, setActionError] = useState<string | null>(null);
  
  // Current step
  const currentStep = steps[currentStepIndex];
  
  // Load onboarding state from localStorage
  useEffect(() => {
    // Don't run on server-side
    if (typeof window === 'undefined') return;
    
    try {
      const savedState = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      
      if (savedState) {
        const { completedSteps, currentIndex } = JSON.parse(savedState);
        
        // Update steps with completed status
        setSteps(prevSteps => 
          prevSteps.map(step => ({
            ...step,
            isCompleted: completedSteps.includes(step.id)
          }))
        );
        
        // Resume from saved step
        setCurrentStepIndex(currentIndex);
      }
    } catch (error) {
      console.error('Failed to load onboarding state', error);
    }
  }, []);
  
  // Save onboarding state to localStorage
  const saveOnboardingState = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const completedSteps = steps
        .filter(step => step.isCompleted)
        .map(step => step.id);
      
      localStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({
          completedSteps,
          currentIndex: currentStepIndex,
        })
      );
    } catch (error) {
      console.error('Failed to save onboarding state', error);
    }
  };
  
  // Mark current step as completed
  const completeCurrentStep = () => {
    setSteps(prevSteps => 
      prevSteps.map((step, index) => 
        index === currentStepIndex ? { ...step, isCompleted: true } : step
      )
    );
  };
  
  // Go to next step
  const goToNextStep = () => {
    completeCurrentStep();
    setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
    setActionError(null);
  };
  
  // Skip current step
  const skipCurrentStep = () => {
    setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
    setActionError(null);
  };
  
  // Complete onboarding
  const completeOnboarding = () => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('wowzarush_onboarding_completed', 'true');
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  };
  
  // Execute step action
  const executeStepAction = async () => {
    if (!currentStep.action) {
      goToNextStep();
      return;
    }
    
    setIsActionLoading(true);
    setActionError(null);
    
    try {
      await currentStep.action();
      goToNextStep();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setIsActionLoading(false);
    }
  };
  
  // Save state when steps or current index changes
  useEffect(() => {
    saveOnboardingState();
  }, [steps, currentStepIndex]);
  
  // Progress percentage
  const progressPercentage = ((currentStepIndex) / (steps.length - 1)) * 100;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-1">
          <div 
            className="bg-blue-500 h-1 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="p-6">
          {/* Step counter */}
          <div className="text-sm text-gray-500 mb-4">
            Step {currentStepIndex + 1} of {steps.length}
          </div>
          
          {/* Step title */}
          <h2 className="text-2xl font-bold mb-4">{currentStep.title}</h2>
          
          {/* Step description */}
          <p className="text-gray-600 mb-8">{currentStep.description}</p>
          
          {/* Error message */}
          {actionError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-700 rounded">
              {actionError}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-between">
            {currentStepIndex > 0 ? (
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                onClick={() => setCurrentStepIndex(prev => Math.max(prev - 1, 0))}
              >
                Back
              </button>
            ) : (
              <div></div> // Empty div to maintain layout
            )}
            
            <div className="flex space-x-4">
              {currentStep.isSkippable && (
                <button
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  onClick={skipCurrentStep}
                >
                  {currentStep.skipLabel || 'Skip'}
                </button>
              )}
              
              <button
                className={`px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isActionLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                onClick={executeStepAction}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  currentStep.actionLabel || 'Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Onboarding Provider
 * Manages whether to show onboarding flow
 */
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    // Don't run on server-side
    if (typeof window === 'undefined') return;
    
    // Check if onboarding has been completed
    const isOnboardingCompleted = localStorage.getItem('wowzarush_onboarding_completed') === 'true';
    
    // Show onboarding if not completed
    if (!isOnboardingCompleted) {
      setShowOnboarding(true);
    }
  }, []);
  
  return (
    <>
      {children}
      {showOnboarding && <OnboardingFlow />}
    </>
  );
}

/**
 * Start Onboarding Button
 * Allows users to manually start onboarding
 */
export function StartOnboardingButton({ className = '' }: { className?: string }) {
  const [isVisible, setIsVisible] = useState(true);
  
  const startOnboarding = () => {
    // Clear onboarding completed state
    localStorage.removeItem('wowzarush_onboarding_completed');
    
    // Reload page to trigger onboarding
    window.location.reload();
  };
  
  useEffect(() => {
    // Don't run on server-side
    if (typeof window === 'undefined') return;
    
    // Check if onboarding is currently being shown
    const isOnboardingCompleted = localStorage.getItem('wowzarush_onboarding_completed') === 'true';
    
    // Only show button if onboarding has been completed
    setIsVisible(isOnboardingCompleted);
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <button
      className={`px-4 py-2 text-blue-600 hover:text-blue-800 focus:outline-none ${className}`}
      onClick={startOnboarding}
    >
      Restart Onboarding
    </button>
  );
} 