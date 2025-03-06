'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Flag, Info, Check, X } from 'lucide-react';
import { useWowzaRush } from '@/context/wowzarushContext';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import React from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

interface RiskAssessmentProps {
  campaignId: string;
  isAdmin?: boolean;
}

// Custom styled Progress component
const StyledProgress = React.forwardRef<
  React.ElementRef<typeof Progress>,
  React.ComponentPropsWithoutRef<typeof Progress> & { indicatorColor?: string }
>(({ className, indicatorColor, ...props }, ref) => (
  <div className="relative w-full">
    <Progress ref={ref} className={className} {...props} />
    {indicatorColor && (
      <div 
        className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"
        style={{ 
          clipPath: `inset(0 ${100 - (props.value || 0)}% 0 0)` 
        }}
      >
        <div className={`h-full w-full ${indicatorColor}`} />
      </div>
    )}
  </div>
));
StyledProgress.displayName = "StyledProgress";

export function RiskAssessment({ campaignId, isAdmin = false }: RiskAssessmentProps) {
  const { 
    isWalletConnected, 
    getCampaignRiskScore, 
    reportCampaign,
    getCampaignReports,
    resolveReport,
    flagCampaign,
    unflagCampaign
  } = useWowzaRush();

  const [isLoading, setIsLoading] = useState(true);
  const [riskScore, setRiskScore] = useState<any | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState(['']);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [unflagReason, setUnflagReason] = useState('');

  useEffect(() => {
    const loadRiskData = async () => {
      setIsLoading(true);
      try {
        const score = await getCampaignRiskScore(campaignId);
        setRiskScore(score);
        
        if (isAdmin) {
          const reportData = await getCampaignReports(campaignId, true);
          setReports(reportData);
        }
      } catch (error) {
        console.error('Error loading risk assessment data:', error);
        toast.error('Failed to load risk assessment data');
      } finally {
        setIsLoading(false);
      }
    };

    loadRiskData();
  }, [campaignId, isAdmin, getCampaignRiskScore, getCampaignReports]);

  const handleAddEvidenceField = () => {
    setEvidenceUrls([...evidenceUrls, '']);
  };

  const handleRemoveEvidenceField = (index: number) => {
    if (evidenceUrls.length === 1) return;
    setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index));
  };

  const handleEvidenceChange = (index: number, value: string) => {
    const newEvidenceUrls = [...evidenceUrls];
    newEvidenceUrls[index] = value;
    setEvidenceUrls(newEvidenceUrls);
  };

  const handleSubmitReport = async () => {
    if (!reportReason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    if (!reportDetails) {
      toast.error('Please provide details about your report');
      return;
    }

    const filteredEvidence = evidenceUrls.filter(url => url.trim() !== '');
    
    try {
      const success = await reportCampaign(
        campaignId, 
        reportReason, 
        reportDetails, 
        filteredEvidence.length > 0 ? filteredEvidence : undefined
      );
      
      if (success) {
        setReportDialogOpen(false);
        setReportReason('');
        setReportDetails('');
        setEvidenceUrls(['']);
        
        // Refresh risk score
        const updatedScore = await getCampaignRiskScore(campaignId);
        setRiskScore(updatedScore);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  const handleResolveReport = async () => {
    if (!selectedReport) return;
    
    if (!resolution) {
      toast.error('Please provide a resolution');
      return;
    }
    
    try {
      const success = await resolveReport(selectedReport, resolution);
      if (success) {
        // Refresh reports
        const updatedReports = await getCampaignReports(campaignId);
        setReports(updatedReports);
        setResolveDialogOpen(false);
        setSelectedReport(null);
        setResolution('');
      }
    } catch (error) {
      console.error('Error resolving report:', error);
    }
  };

  const handleFlagCampaign = async () => {
    try {
      await flagCampaign(campaignId, 'Manually flagged by admin');
      toast.success('Campaign has been flagged');
      // Refresh risk score
      const updatedScore = await getCampaignRiskScore(campaignId);
      setRiskScore(updatedScore);
    } catch (error) {
      console.error('Error flagging campaign:', error);
    }
  };

  const handleUnflagCampaign = async () => {
    if (!unflagReason) {
      toast.error('Please provide a reason for unflagging');
      return;
    }
    
    try {
      await unflagCampaign(campaignId, unflagReason);
      toast.success('Campaign has been unflagged');
      setUnflagReason('');
      // Refresh risk score
      const updatedScore = await getCampaignRiskScore(campaignId);
      setRiskScore(updatedScore);
    } catch (error) {
      console.error('Error unflagging campaign:', error);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'low':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'critical':
        return <Flag className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Score Card */}
      {riskScore && (
        <Card className={`p-4 border-l-4 ${
          getRiskLevelColor(riskScore.level).replace('bg-', 'border-')
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <h3 className="font-medium">Campaign Risk Assessment</h3>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`px-2 py-1 rounded-full text-xs text-white ${getRiskLevelColor(riskScore.level)}`}>
                    {riskScore.level.charAt(0).toUpperCase() + riskScore.level.slice(1)} Risk
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Risk score: {riskScore.score}/100</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="mt-2">
            <StyledProgress
              value={riskScore.score}
              className="h-2"
              indicatorColor={getRiskLevelColor(riskScore.level)}
            />
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            {riskScore.score < 25 ? (
              <>
                <Check className="inline h-4 w-4 text-green-500 mr-1" />
                This campaign appears to be low risk.
              </>
            ) : (
              <>
                {getRiskLevelIcon(riskScore.level)}
                <span className="ml-1">{riskScore && riskScore.factors ? 
                  Object.keys(riskScore.factors).filter(key => riskScore.factors[key]).length : 0} risk factors identified.
                </span>
              </>
            )}
          </p>
          
          {riskScore && riskScore.factors && Object.keys(riskScore.factors).some(key => riskScore.factors[key]) && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="risk-factors">
                <AccordionTrigger className="text-sm">View risk factors</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm">
                    {Object.keys(riskScore.factors).map((factor) => {
                      if (!riskScore.factors[factor]) return null;
                      
                      let factorDescription = '';
                      switch (factor) {
                        case 'unrealisticGoals':
                          factorDescription = 'Campaign goals appear unrealistic for the timeline and budget';
                          break;
                        case 'vagueMilestones':
                          factorDescription = 'Milestones lack specific details or measurable outcomes';
                          break;
                        case 'lacksCreatorHistory':
                          factorDescription = 'Creator has limited history on the platform';
                          break;
                        case 'noSocialMediaPresence':
                          factorDescription = 'Creator lacks verifiable social media presence';
                          break;
                        case 'suspiciousLinks':
                          factorDescription = 'Campaign contains potentially suspicious external links';
                          break;
                        case 'unusualFundingPattern':
                          factorDescription = 'Unusual pattern of funding transactions detected';
                          break;
                        case 'suspiciousWalletActivities':
                          factorDescription = 'Suspicious wallet activities associated with this campaign';
                          break;
                        case 'multipleReports':
                          factorDescription = 'Campaign has received multiple user reports';
                          break;
                        case 'negativeCommentRatio':
                          factorDescription = 'High ratio of negative comments or concerns';
                          break;
                        case 'unverifiedIdentity':
                          factorDescription = 'Creator has not completed identity verification';
                          break;
                        case 'newAccount':
                          factorDescription = 'Creator account is relatively new';
                          break;
                        default:
                          factorDescription = factor.replace(/([A-Z])/g, ' $1').toLowerCase();
                      }
                      
                      return (
                        <li key={factor} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <span>{factorDescription}</span>
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          <div className="mt-4 flex justify-end">
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Flag className="h-4 w-4 mr-2" />
                  Report Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report this campaign</DialogTitle>
                  <DialogDescription>
                    Please provide details about why you're reporting this campaign. 
                    Your report will be reviewed by our team.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for reporting</Label>
                    <Select value={reportReason} onValueChange={setReportReason}>
                      <SelectTrigger id="reason">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scam">Potential scam</SelectItem>
                        <SelectItem value="fraud">Fraudulent claims</SelectItem>
                        <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                        <SelectItem value="copyright">Copyright violation</SelectItem>
                        <SelectItem value="duplicate">Duplicate campaign</SelectItem>
                        <SelectItem value="other">Other concern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="details">Details</Label>
                    <Textarea 
                      id="details" 
                      placeholder="Please provide specific details about your concerns..." 
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Evidence (optional)</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Provide links to evidence supporting your report (screenshots, articles, etc.)
                    </p>
                    
                    {evidenceUrls.map((url, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input 
                          placeholder="https://example.com/evidence" 
                          value={url}
                          onChange={(e) => handleEvidenceChange(index, e.target.value)}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveEvidenceField(index)}
                          disabled={evidenceUrls.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddEvidenceField}
                    >
                      Add Another Link
                    </Button>
                  </div>
                </div>
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSubmitReport}>Submit Report</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {isAdmin && (
              <div className="flex space-x-2 ml-2">
                {riskScore.flaggedBy ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Check className="h-4 w-4 mr-2" />
                        Unflag Campaign
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Unflag this campaign</DialogTitle>
                        <DialogDescription>
                          Please provide a reason for unflagging this campaign.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="unflag-reason">Reason for unflagging</Label>
                          <Textarea 
                            id="unflag-reason" 
                            placeholder="Explain why this campaign should be unflagged..." 
                            value={unflagReason}
                            onChange={(e) => setUnflagReason(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleUnflagCampaign}>Unflag Campaign</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleFlagCampaign}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Flag Campaign
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
      
      {/* Admin Reports Section */}
      {isAdmin && reports.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">User Reports ({reports.length})</h3>
          
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className={`p-4 ${report.resolved ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'}`}>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center">
                    <Flag className={`h-4 w-4 mr-2 ${report.resolved ? 'text-green-500' : 'text-yellow-500'}`} />
                    <span className="font-medium">{report.reason}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-sm mb-3">{report.details}</p>
                
                {report.evidence && report.evidence.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-1">Evidence:</p>
                    <ul className="text-xs space-y-1">
                      {report.evidence.map((url: string, i: number) => (
                        <li key={i}>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-500 hover:underline break-all"
                          >
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    Reporter: {report.reporterAddress.substring(0, 6)}...{report.reporterAddress.substring(report.reporterAddress.length - 4)}
                  </div>
                  
                  {report.resolved ? (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      <span className="font-medium">Resolved:</span> {report.resolution}
                    </div>
                  ) : (
                    <Dialog open={resolveDialogOpen && selectedReport === report.id} onOpenChange={(open) => {
                      setResolveDialogOpen(open);
                      if (!open) setSelectedReport(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedReport(report.id)}
                        >
                          Resolve
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Resolve Report</DialogTitle>
                          <DialogDescription>
                            Please provide details about how this report was resolved.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="resolution">Resolution</Label>
                            <Textarea 
                              id="resolution" 
                              placeholder="Explain how this report was resolved..." 
                              value={resolution}
                              onChange={(e) => setResolution(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button onClick={handleResolveReport}>Mark as Resolved</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 