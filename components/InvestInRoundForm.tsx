'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { ethers } from 'ethers';
import { FundingRound } from '@/types';

interface InvestInRoundFormProps {
  campaignId: string;
  fundingRound: FundingRound;
  blockchainService: any;
  onSuccess: () => void;
  userAddress: string | null;
}

const InvestInRoundForm: React.FC<InvestInRoundFormProps> = ({
  campaignId,
  fundingRound,
  blockchainService,
  onSuccess,
  userAddress,
}) => {
  const { toast } = useToast();
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [userContribution, setUserContribution] = useState('0');
  
  // Calculate equity received based on investment
  const calculateEquityPerInvestment = (amount: number): number => {
    if (!amount || !fundingRound) return 0;
    
    const targetAmount = parseFloat(ethers.utils.formatEther(fundingRound.targetAmount));
    const equityBasisPoints = fundingRound.equityOffered;
    
    // Calculate equity percentage for the investment
    // (investment / target) * equity offered
    return amount * (equityBasisPoints / 100) / targetAmount;
  };
  
  const equityReceived = calculateEquityPerInvestment(parseFloat(investmentAmount) || 0);
  
  // Get user's current contribution
  useEffect(() => {
    const fetchUserContribution = async () => {
      if (userAddress && blockchainService) {
        try {
          const contribution = await blockchainService.getInvestorContribution(
            campaignId,
            fundingRound.series,
            userAddress
          );
          setUserContribution(ethers.utils.formatEther(contribution));
        } catch (error) {
          console.error('Error fetching user contribution:', error);
          setUserContribution('0');
        }
      }
    };
    
    fetchUserContribution();
  }, [userAddress, campaignId, fundingRound.series, blockchainService]);
  
  // Validate form
  const validate = () => {
    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      setValidationError('Investment amount must be greater than 0');
      return false;
    }
    
    const minInvestment = parseFloat(ethers.utils.formatEther(fundingRound.minInvestment));
    if (parseFloat(investmentAmount) < minInvestment) {
      setValidationError(`Investment amount must be at least ${minInvestment} TLOS`);
      return false;
    }
    
    setValidationError('');
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Convert investment amount to wei
      const investmentAmountWei = ethers.utils.parseEther(investmentAmount);
      
      // Call blockchain service to invest in round
      await blockchainService.investInRound(
        campaignId,
        fundingRound.series,
        investmentAmountWei
      );
      
      toast({
        title: 'Investment Successful',
        description: `You have successfully invested ${investmentAmount} TLOS in this funding round`,
      });
      
      // Call onSuccess callback
      onSuccess();
      
      // Reset form
      setInvestmentAmount('');
    } catch (error: any) {
      console.error('Error investing in round:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete investment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format round details for display
  const formatCurrency = (value: ethers.BigNumberish): string => {
    return parseFloat(ethers.utils.formatEther(value)).toLocaleString();
  };
  
  const formatPercentage = (value: number): string => {
    return (value / 100).toFixed(2) + '%';
  };
  
  // Check if round is active
  const isRoundActive = fundingRound.isActive;
  
  // Get series name
  const getSeriesName = (series: number): string => {
    switch (series) {
      case 0: return 'Seed';
      case 1: return 'Series A';
      case 2: return 'Series B';
      case 3: return 'Series C';
      default: return `Series ${series}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invest in {getSeriesName(fundingRound.series)} Funding Round</CardTitle>
        <CardDescription>
          {isRoundActive ? 'Invest in this funding round to receive equity' : 'This funding round is not currently active'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Target Amount</p>
            <p className="font-medium">{formatCurrency(fundingRound.targetAmount)} TLOS</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Min Investment</p>
            <p className="font-medium">{formatCurrency(fundingRound.minInvestment)} TLOS</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Equity Offered</p>
            <p className="font-medium">{formatPercentage(fundingRound.equityOffered)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Raised So Far</p>
            <p className="font-medium">{formatCurrency(fundingRound.amountRaised)} TLOS</p>
          </div>
        </div>
        
        {parseFloat(userContribution) > 0 && (
          <div className="p-3 bg-muted rounded-md mb-4">
            <p className="font-medium">Your Current Investment</p>
            <p className="text-sm mt-1">
              You have already invested {parseFloat(userContribution).toLocaleString()} TLOS in this round
            </p>
          </div>
        )}
        
        {isRoundActive ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="investmentAmount">Investment Amount (TLOS)</Label>
              <Input
                id="investmentAmount"
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                placeholder={`Enter amount (min ${formatCurrency(fundingRound.minInvestment)})`}
                className={validationError ? 'border-red-500' : ''}
                step="0.01"
                min={parseFloat(ethers.utils.formatEther(fundingRound.minInvestment))}
              />
              {validationError && (
                <p className="text-sm text-red-500">{validationError}</p>
              )}
            </div>
            
            {parseFloat(investmentAmount) > 0 && (
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">Equity You Will Receive</p>
                <p className="text-sm mt-1">
                  {equityReceived.toFixed(4)}% equity ({parseFloat(investmentAmount).toLocaleString()} TLOS investment)
                </p>
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isSubmitting || !userAddress}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Investment...
                </>
              ) : !userAddress ? 'Connect Wallet to Invest' : 'Invest Now'}
            </Button>
          </form>
        ) : (
          <div className="text-center p-4 border border-dashed rounded-md">
            <p className="text-muted-foreground">This funding round is currently not active</p>
          </div>
        )}
      </CardContent>
      
      {isRoundActive && (
        <CardFooter className="flex flex-col items-start">
          <p className="text-sm text-muted-foreground">
            By investing, you are purchasing equity in this company. The transaction will be recorded on the blockchain.
          </p>
        </CardFooter>
      )}
    </Card>
  );
};

export default InvestInRoundForm; 