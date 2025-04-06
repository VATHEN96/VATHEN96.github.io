import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FundingRound } from '@/types';
import { formatBlockchainValue } from '@/utils/formatting';
import { ethers } from 'ethers';

interface SeriesFundingDetailsProps {
  campaign: any;
  currentRound: FundingRound;
  onInvest: (amount: string) => Promise<void>;
}

const SeriesFundingDetails: React.FC<SeriesFundingDetailsProps> = ({
  campaign,
  currentRound,
  onInvest
}) => {
  const [investAmount, setInvestAmount] = React.useState('');
  const [isInvesting, setIsInvesting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  // Get series name based on index
  const getSeriesName = (index: number) => {
    switch(index) {
      case 0: return 'SEED';
      case 1: return 'Series A';
      case 2: return 'Series B';
      case 3: return 'Series C';
      default: return `Series ${index}`;
    }
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    const target = parseFloat(ethers.utils.formatEther(currentRound.targetAmount.toString()));
    const raised = parseFloat(ethers.utils.formatEther(currentRound.amountRaised.toString()));
    return Math.min(100, (raised / target) * 100);
  };

  // Format date from Unix timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Calculate equity per investment
  const calculateEquityPerInvestment = (amount: string) => {
    if (!amount || parseFloat(amount) === 0) return 0;
    
    const investmentAmount = parseFloat(amount);
    const totalRaised = parseFloat(ethers.utils.formatEther(currentRound.amountRaised.toString()));
    const totalTarget = parseFloat(ethers.utils.formatEther(currentRound.targetAmount.toString()));
    
    // Calculate percentage of total round the investment represents
    const investmentPercentOfRound = investmentAmount / totalTarget;
    
    // Calculate equity this investment would receive
    const equityBasisPoints = currentRound.equityOffered;
    const equityPercentage = equityBasisPoints / 100;
    
    return (investmentPercentOfRound * equityPercentage).toFixed(2);
  };

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!investAmount || parseFloat(investAmount) <= 0) {
      setError('Please enter a valid amount to invest');
      return;
    }

    // Validate minimum investment
    const minInvestment = parseFloat(ethers.utils.formatEther(currentRound.minInvestment.toString()));
    if (parseFloat(investAmount) < minInvestment) {
      setError(`Minimum investment is ${minInvestment} TLOS`);
      return;
    }

    setIsInvesting(true);
    setError('');
    
    try {
      await onInvest(investAmount);
      setSuccess(`Successfully invested ${investAmount} TLOS in ${getSeriesName(currentRound.series)}`);
      setInvestAmount('');
    } catch (err: any) {
      setError(err.message || 'Failed to invest');
    } finally {
      setIsInvesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                {getSeriesName(currentRound.series)} Funding Round
              </CardTitle>
              <CardDescription>
                Company Valuation: {formatBlockchainValue(campaign.totalValuation)} TLOS
              </CardDescription>
            </div>
            <Badge variant={currentRound.isActive ? "default" : "secondary"}>
              {currentRound.isActive ? "Active" : currentRound.isComplete ? "Completed" : "Pending"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Target Amount</p>
              <p className="font-medium">{formatBlockchainValue(currentRound.targetAmount)} TLOS</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Minimum Investment</p>
              <p className="font-medium">{formatBlockchainValue(currentRound.minInvestment)} TLOS</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Equity Offered</p>
              <p className="font-medium">{currentRound.equityOffered / 100}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Investors</p>
              <p className="font-medium">{currentRound.investorCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="font-medium">{formatDate(currentRound.startTime)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Date</p>
              <p className="font-medium">{formatDate(currentRound.endTime)}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm">Progress</span>
              <span className="text-sm font-medium">
                {formatBlockchainValue(currentRound.amountRaised)} / {formatBlockchainValue(currentRound.targetAmount)} TLOS
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-2 w-full" />
          </div>

          {currentRound.isActive && (
            <form onSubmit={handleInvest} className="mt-6 space-y-4">
              <div>
                <label htmlFor="investAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Investment Amount (TLOS)
                </label>
                <div className="flex space-x-2">
                  <input
                    id="investAmount"
                    type="number"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder={`Min: ${formatBlockchainValue(currentRound.minInvestment)}`}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 w-full"
                    step="0.01"
                    min={parseFloat(ethers.utils.formatEther(currentRound.minInvestment.toString()))}
                  />
                  <button
                    type="submit"
                    disabled={isInvesting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isInvesting ? 'Investing...' : 'Invest'}
                  </button>
                </div>
                {investAmount && (
                  <p className="text-sm text-gray-600 mt-1">
                    You will receive approximately {calculateEquityPerInvestment(investAmount)}% equity
                  </p>
                )}
              </div>
              
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md">
                  {success}
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Milestone Tracking</CardTitle>
          <CardDescription>
            Track progress through funding milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaign.milestones && campaign.milestones.map((milestone: any, index: number) => (
              <div key={index} className="border-l-4 pl-4 py-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${milestone.isCompleted ? 'text-green-600' : ''}`}>
                    {milestone.title}
                  </h4>
                  <Badge variant={milestone.isCompleted ? "default" : "outline"}>
                    {milestone.isCompleted ? "Completed" : "Pending"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {milestone.description}
                </p>
                <p className="text-sm font-medium mt-1">
                  Target: {formatBlockchainValue(milestone.targetAmount)} TLOS
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeriesFundingDetails; 