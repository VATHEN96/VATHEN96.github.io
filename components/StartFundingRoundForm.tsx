'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { ethers } from 'ethers';

interface StartFundingRoundFormProps {
  campaignId: string;
  currentValuation: string;
  blockchainService: any;
  onSuccess: () => void;
  series: number;
}

const getSeriesToLabel = (series: number): string => {
  switch (series) {
    case 0: return 'Seed';
    case 1: return 'Series A';
    case 2: return 'Series B';
    case 3: return 'Series C';
    default: return `Series ${series}`;
  }
};

const StartFundingRoundForm: React.FC<StartFundingRoundFormProps> = ({
  campaignId,
  currentValuation,
  blockchainService,
  onSuccess,
  series,
}) => {
  const { toast } = useToast();
  const [targetAmount, setTargetAmount] = useState('');
  const [minInvestment, setMinInvestment] = useState('');
  const [equityOffered, setEquityOffered] = useState('');
  const [duration, setDuration] = useState('30'); // 30 days default
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const valuationAmount = currentValuation ? parseFloat(currentValuation) : 0;
  const equityPercentage = equityOffered ? parseFloat(equityOffered) : 0;
  const targetAmountValue = targetAmount ? parseFloat(targetAmount) : 0;
  
  // Calculated implied valuation
  const impliedValuation = equityPercentage > 0 
    ? (targetAmountValue * 100) / equityPercentage
    : 0;

  // Validate form
  const validate = () => {
    const errors: Record<string, string> = {};

    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      errors.targetAmount = 'Target amount must be greater than 0';
    }
    
    if (!minInvestment || parseFloat(minInvestment) <= 0) {
      errors.minInvestment = 'Minimum investment must be greater than 0';
    } else if (parseFloat(minInvestment) > parseFloat(targetAmount)) {
      errors.minInvestment = 'Minimum investment cannot exceed target amount';
    }
    
    if (!equityOffered || parseFloat(equityOffered) <= 0) {
      errors.equityOffered = 'Equity offered must be greater than 0';
    } else if (parseFloat(equityOffered) > 100) {
      errors.equityOffered = 'Equity offered cannot exceed 100%';
    }
    
    if (!duration || parseInt(duration) <= 0) {
      errors.duration = 'Duration must be greater than 0';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Convert values to appropriate formats for blockchain
      const targetAmountWei = ethers.utils.parseEther(targetAmount);
      const minInvestmentWei = ethers.utils.parseEther(minInvestment);
      const equityBasisPoints = Math.floor(parseFloat(equityOffered) * 100); // Convert percentage to basis points
      const durationSeconds = parseInt(duration) * 86400; // Convert days to seconds
      
      // Call blockchain service to start funding round
      await blockchainService.startFundingRound(
        campaignId,
        targetAmountWei,
        minInvestmentWei,
        equityBasisPoints,
        durationSeconds
      );
      
      toast({
        title: 'Funding Round Started',
        description: `${getSeriesToLabel(series)} funding round has been started successfully`,
      });
      
      // Call onSuccess callback
      onSuccess();
      
      // Reset form
      setTargetAmount('');
      setMinInvestment('');
      setEquityOffered('');
      setDuration('30');
    } catch (error: any) {
      console.error('Error starting funding round:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start funding round',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start {getSeriesToLabel(series)} Funding Round</CardTitle>
        <CardDescription>
          Current company valuation: {valuationAmount.toLocaleString()} TLOS
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount (TLOS)</Label>
              <Input
                id="targetAmount"
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="Enter target amount"
                className={validationErrors.targetAmount ? 'border-red-500' : ''}
                step="0.01"
                min="0"
              />
              {validationErrors.targetAmount && (
                <p className="text-sm text-red-500">{validationErrors.targetAmount}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minInvestment">Minimum Investment (TLOS)</Label>
              <Input
                id="minInvestment"
                type="number"
                value={minInvestment}
                onChange={(e) => setMinInvestment(e.target.value)}
                placeholder="Enter minimum investment amount"
                className={validationErrors.minInvestment ? 'border-red-500' : ''}
                step="0.01"
                min="0"
              />
              {validationErrors.minInvestment && (
                <p className="text-sm text-red-500">{validationErrors.minInvestment}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="equityOffered">Equity Offered (%)</Label>
              <Input
                id="equityOffered"
                type="number"
                value={equityOffered}
                onChange={(e) => setEquityOffered(e.target.value)}
                placeholder="Enter equity percentage"
                className={validationErrors.equityOffered ? 'border-red-500' : ''}
                step="0.01"
                min="0"
                max="100"
              />
              {validationErrors.equityOffered && (
                <p className="text-sm text-red-500">{validationErrors.equityOffered}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Round Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Enter duration in days"
                className={validationErrors.duration ? 'border-red-500' : ''}
                min="1"
              />
              {validationErrors.duration && (
                <p className="text-sm text-red-500">{validationErrors.duration}</p>
              )}
            </div>
          </div>
          
          {impliedValuation > 0 && (
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">Implied Valuation: {impliedValuation.toLocaleString()} TLOS</p>
              <p className="text-sm text-muted-foreground mt-1">
                Based on raising {targetAmountValue.toLocaleString()} TLOS for {equityPercentage}% equity
              </p>
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Funding Round...
              </>
            ) : `Start ${getSeriesToLabel(series)} Funding Round`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default StartFundingRoundForm; 