"use client";

import React, { useState } from 'react';
import { CircleDollarSign, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatBlockchainValue } from '@/utils/formatting';

interface ContributeFormProps {
  campaignId: string;
  minimumContribution?: number;
  goalAmount: number;
}

export default function ContributeForm({ campaignId, minimumContribution = 5, goalAmount }: ContributeFormProps) {
  const [amount, setAmount] = useState<number>(minimumContribution);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  
  // Placeholder predefined amounts
  const predefinedAmounts = [10, 25, 50, 100];
  
  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount < minimumContribution) {
      alert(`Minimum contribution is ${minimumContribution} TLOS`);
      return;
    }
    
    setIsProcessing(true);
    
    // This would be replaced with actual blockchain transaction logic
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Successfully contributed ${amount} TLOS to campaign!`);
      setIsProcessing(false);
    } catch (error) {
      console.error("Error contributing:", error);
      alert("There was an error processing your contribution");
      setIsProcessing(false);
    }
  };
  
  return (
    <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="bg-green-50 border-b border-gray-200">
        <CardTitle className="text-xl font-bold">Support this Campaign</CardTitle>
        <CardDescription>
          Your contribution helps bring this project to life
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={handleContribute}>
          <div className="space-y-6">
            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="amount" className="text-base font-medium">
                  Contribution Amount
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[200px] text-sm">
                        Minimum contribution: {minimumContribution} TLOS.
                        Enter the amount you wish to contribute.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="relative">
                <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  id="amount"
                  type="number"
                  min={minimumContribution}
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="pl-10 pr-16 h-12 text-lg border-2 border-gray-300 focus:border-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  TLOS
                </span>
              </div>
              
              {/* Predefined amounts */}
              <div className="flex flex-wrap gap-2 pt-2">
                {predefinedAmounts.map((preAmount) => (
                  <Button
                    key={preAmount}
                    type="button"
                    variant="outline"
                    onClick={() => setAmount(preAmount)}
                    className={`px-4 py-1 ${
                      amount === preAmount ? 'bg-green-100 border-green-500' : ''
                    }`}
                  >
                    {preAmount} TLOS
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isProcessing || amount < minimumContribution}
              className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-semibold text-lg border-2 border-black"
            >
              {isProcessing ? 'Processing...' : 'Contribute Now'}
            </Button>
          </div>
        </form>
      </CardContent>
      
      <CardFooter className="flex-col border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-800"
        >
          <span>Transaction Details</span>
          {showDetails ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        
        {showDetails && (
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Network Fee</span>
              <span>~0.01 TLOS</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee (5%)</span>
              <span>{(amount * 0.05).toFixed(2)} TLOS</span>
            </div>
            <div className="flex justify-between font-semibold pt-2">
              <span>Total</span>
              <span>{(amount + amount * 0.05 + 0.01).toFixed(2)} TLOS</span>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 