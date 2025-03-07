'use client';

import React, { useState, useEffect } from 'react';
import { useWowzaRush } from '@/context/wowzarushContext';
import { DeliveryStatus, DeliveryMilestone } from '@/services/NotificationService';
import { format, formatDistance } from 'date-fns';
import { CheckCircle2, Clock, AlertTriangle, Truck, PackageCheck, Calendar, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeliveryTrackerProps {
  campaignId: string;
  isCreator?: boolean;
}

export function DeliveryTracker({ campaignId, isCreator = false }: DeliveryTrackerProps) {
  const { 
    account,
    isWalletConnected, 
    getDeliveryStatus, 
    updateDeliveryStatus, 
    updateMilestone, 
    getCampaignTiers 
  } = useWowzaRush();
  
  const [deliveryStatuses, setDeliveryStatuses] = useState<DeliveryStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [rewardTiers, setRewardTiers] = useState<any[]>([]);
  
  // Load delivery statuses when component mounts
  useEffect(() => {
    if (campaignId) {
      loadDeliveryStatuses();
      loadRewardTiers();
    }
  }, [campaignId]);

  const loadDeliveryStatuses = async () => {
    setLoading(true);
    try {
      const statuses = await getDeliveryStatus(campaignId);
      setDeliveryStatuses(statuses);
      
      if (statuses.length > 0 && !selectedTierId) {
        setSelectedTierId(statuses[0].rewardTierId);
      }
    } catch (error) {
      console.error(`Error loading delivery statuses for campaign ${campaignId}:`, error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadRewardTiers = async () => {
    try {
      const tiers = await getCampaignTiers(campaignId);
      setRewardTiers(tiers);
    } catch (error) {
      console.error(`Error loading reward tiers for campaign ${campaignId}:`, error);
    }
  };
  
  const handleUpdateMilestone = async (deliveryId: string, milestoneId: string, status: DeliveryMilestone['status'], completedDate: number | null = null) => {
    if (!isCreator) return;
    
    try {
      const update: Partial<DeliveryMilestone> = {
        status,
        completedDate: status === 'completed' ? (completedDate || Date.now()) : null
      };
      
      const success = await updateMilestone(deliveryId, milestoneId, update);
      
      if (success) {
        // Update local state
        setDeliveryStatuses(current => 
          current.map(delivery => 
            delivery.id === deliveryId 
              ? {
                  ...delivery,
                  milestones: delivery.milestones.map(milestone => 
                    milestone.id === milestoneId
                      ? { ...milestone, ...update }
                      : milestone
                  )
                }
              : delivery
          )
        );
        
        toast.success(`Milestone ${status === 'completed' ? 'completed' : 'updated'} successfully!`);
        
        // If all milestones are completed, update the delivery status
        const updatedDelivery = deliveryStatuses.find(d => d.id === deliveryId);
        if (updatedDelivery) {
          const allCompleted = updatedDelivery.milestones.every(m => 
            m.id === milestoneId ? status === 'completed' : m.status === 'completed'
          );
          
          if (allCompleted) {
            handleUpdateDeliveryStatus(deliveryId, { shippingCompleted: true });
          }
        }
      }
    } catch (error) {
      console.error(`Error updating milestone ${milestoneId}:`, error);
      toast.error('Failed to update milestone');
    }
  };
  
  const handleUpdateDeliveryStatus = async (deliveryId: string, updates: Partial<DeliveryStatus>) => {
    if (!isCreator) return;
    
    try {
      const success = await updateDeliveryStatus(deliveryId, updates);
      
      if (success) {
        // Update local state
        setDeliveryStatuses(current => 
          current.map(delivery => 
            delivery.id === deliveryId 
              ? { ...delivery, ...updates }
              : delivery
          )
        );
        
        toast.success('Delivery status updated successfully!');
      }
    } catch (error) {
      console.error(`Error updating delivery status ${deliveryId}:`, error);
      toast.error('Failed to update delivery status');
    }
  };
  
  const getStatusColor = (status: DeliveryMilestone['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'delayed':
        return 'bg-amber-500';
      default:
        return 'bg-gray-300';
    }
  };
  
  const getStatusIcon = (status: DeliveryMilestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'delayed':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };
  
  const calculateProgress = (delivery: DeliveryStatus) => {
    if (!delivery.milestones.length) return 0;
    
    const completedCount = delivery.milestones.filter(m => m.status === 'completed').length;
    return Math.round((completedCount / delivery.milestones.length) * 100);
  };
  
  const getDeliveryStatusBadge = (delivery: DeliveryStatus) => {
    const progress = calculateProgress(delivery);
    
    if (delivery.shippingCompleted) {
      return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
    } else if (delivery.shippingStarted) {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Shipping</Badge>;
    } else if (progress === 100) {
      return <Badge className="bg-indigo-500 hover:bg-indigo-600">Ready to Ship</Badge>;
    } else if (progress > 0) {
      return <Badge className="bg-amber-500 hover:bg-amber-600">In Progress</Badge>;
    } else {
      return <Badge variant="outline">Not Started</Badge>;
    }
  };
  
  const selectedDelivery = selectedTierId
    ? deliveryStatuses.find(status => status.rewardTierId === selectedTierId)
    : deliveryStatuses[0];
  
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-8 w-40" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!deliveryStatuses.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delivery Tracking</CardTitle>
          <CardDescription>
            No delivery information is available for this campaign yet.
          </CardDescription>
        </CardHeader>
        {isCreator && (
          <CardFooter>
            <Button>Set Up Delivery Timeline</Button>
          </CardFooter>
        )}
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Delivery Tracking</h2>
          <p className="text-muted-foreground">Track the progress of your rewards</p>
        </div>
        
        {deliveryStatuses.length > 1 && (
          <Select
            value={selectedTierId || ''}
            onValueChange={(value) => setSelectedTierId(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select reward tier" />
            </SelectTrigger>
            <SelectContent>
              {deliveryStatuses.map((status) => (
                <SelectItem key={status.rewardTierId} value={status.rewardTierId}>
                  {status.rewardTierName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {selectedDelivery && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{selectedDelivery.rewardTierName}</CardTitle>
                <CardDescription>
                  Estimated delivery: {format(new Date(selectedDelivery.estimatedDeliveryDate), 'MMMM d, yyyy')}
                </CardDescription>
              </div>
              {getDeliveryStatusBadge(selectedDelivery)}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-medium">{calculateProgress(selectedDelivery)}%</span>
                </div>
                <Progress value={calculateProgress(selectedDelivery)} className="h-2" />
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="milestones">
                  <AccordionTrigger>Delivery Milestones</AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-6 relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800"></div>
                        
                        {selectedDelivery.milestones.map((milestone, index) => (
                          <div key={milestone.id} className="flex gap-4 relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${getStatusColor(milestone.status)}`}>
                              {index + 1}
                            </div>
                            
                            <div className="flex-1 bg-card rounded-lg p-4 shadow-sm border">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{milestone.title}</h4>
                                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                                </div>
                                {getStatusIcon(milestone.status)}
                              </div>
                              
                              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  <span>Target: {format(new Date(milestone.targetDate), 'MMM d, yyyy')}</span>
                                </div>
                                
                                {milestone.completedDate && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span>Completed: {format(new Date(milestone.completedDate), 'MMM d, yyyy')}</span>
                                  </div>
                                )}
                                
                                {!milestone.completedDate && milestone.targetDate < Date.now() && milestone.status !== 'completed' && (
                                  <div className="flex items-center gap-1 text-amber-500">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>
                                      {milestone.status === 'delayed' 
                                        ? 'Delayed' 
                                        : `Overdue by ${formatDistance(new Date(milestone.targetDate), new Date())}`
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {isCreator && milestone.status !== 'completed' && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  <Button 
                                    size="sm" 
                                    variant={milestone.status === 'in-progress' ? 'default' : 'outline'}
                                    onClick={() => handleUpdateMilestone(selectedDelivery.id, milestone.id, 'in-progress')}
                                  >
                                    Mark In Progress
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant={(milestone.status === 'completed') ? 'default' : 'outline'}
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleUpdateMilestone(selectedDelivery.id, milestone.id, 'completed')}
                                  >
                                    Mark Complete
                                  </Button>
                                  {milestone.targetDate < Date.now() && milestone.status !== 'delayed' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-amber-500 border-amber-500 hover:bg-amber-50 hover:text-amber-600"
                                      onClick={() => handleUpdateMilestone(selectedDelivery.id, milestone.id, 'delayed')}
                                    >
                                      Mark Delayed
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="shipping">
                  <AccordionTrigger>Shipping Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h4 className="font-medium">Shipping Status</h4>
                          <p className="text-sm text-muted-foreground">Current status of your reward shipment</p>
                        </div>
                        
                        {selectedDelivery.shippingStarted ? (
                          selectedDelivery.shippingCompleted ? (
                            <Badge className="bg-green-500 hover:bg-green-600">Delivered</Badge>
                          ) : (
                            <Badge className="bg-blue-500 hover:bg-blue-600">In Transit</Badge>
                          )
                        ) : (
                          <Badge variant="outline">Not Shipped</Badge>
                        )}
                      </div>
                      
                      {calculateProgress(selectedDelivery) === 100 && !selectedDelivery.shippingStarted && (
                        <div className="flex justify-end">
                          <Button 
                            className="mt-2"
                            onClick={() => handleUpdateDeliveryStatus(selectedDelivery.id, { 
                              shippingStarted: true, 
                              trackingAvailable: true,
                              updatedAt: Date.now()
                            })}
                            disabled={!isCreator}
                          >
                            <Truck className="mr-2 h-4 w-4" />
                            {isCreator ? 'Begin Shipping Process' : 'Shipping Soon'}
                          </Button>
                        </div>
                      )}
                      
                      {selectedDelivery.shippingStarted && !selectedDelivery.shippingCompleted && (
                        <div className="flex justify-end">
                          <Button 
                            className="mt-2 bg-green-600 hover:bg-green-700"
                            onClick={() => handleUpdateDeliveryStatus(selectedDelivery.id, { 
                              shippingCompleted: true,
                              updatedAt: Date.now()
                            })}
                            disabled={!isCreator}
                          >
                            <PackageCheck className="mr-2 h-4 w-4" />
                            {isCreator ? 'Mark Shipping Complete' : 'In Transit'}
                          </Button>
                        </div>
                      )}
                      
                      {selectedDelivery.shippingStarted && (
                        <div className="mt-4 bg-muted p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-4">
                            <Truck className="h-5 w-5" />
                            <h4 className="font-medium">Shipping Updates</h4>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">Production Completed</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(selectedDelivery.updatedAt), 'MMMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            
                            {selectedDelivery.shippingStarted && (
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Truck className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium">Shipping Started</p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(selectedDelivery.updatedAt), 'MMMM d, yyyy')}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {selectedDelivery.shippingCompleted && (
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                  <PackageCheck className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium">Delivery Completed</p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(selectedDelivery.updatedAt), 'MMMM d, yyyy')}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 