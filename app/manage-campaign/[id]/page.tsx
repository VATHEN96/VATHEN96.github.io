"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWowzaRush } from "@/context/wowzarushContext";
import Navbar from "@/components/navbar";
import { ArrowLeft, Edit, Save, AlertTriangle, Wallet, Lock, Check, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBlockchainValue, formatCategory, calculateProgress } from "@/utils/formatting";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";
import { toast } from "sonner";

export default function ManageCampaignPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getCampaign, updateCampaign, isWalletConnected, connectWallet, account } = useWowzaRush();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [editing, setEditing] = useState(false);
  
  // Get campaign data
  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const campaignData = await getCampaign(id as string);
        
        if (!campaignData) {
          setError("Campaign not found");
          setLoading(false);
          return;
        }
        
        // Check if the current user is the creator
        if (account && campaignData.creator && 
            account.toLowerCase() !== campaignData.creator.toLowerCase()) {
          setError("You don't have permission to manage this campaign");
          setLoading(false);
          return;
        }
        
        setCampaign(campaignData);
        
        // Initialize editable fields
        setTitle(campaignData.title || "");
        setDescription(campaignData.description || "");
        setMediaUrl(campaignData.imageUrl || campaignData.media?.[0] || "");
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching campaign:", err);
        setError("Failed to load campaign data");
        setLoading(false);
      }
    };
    
    if (isWalletConnected) {
      fetchCampaign();
    }
  }, [id, getCampaign, isWalletConnected, account]);
  
  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      // Only update fields that are editable (non-blockchain stored data)
      const updatedData = {
        id: campaign.id,
        title: title,
        description: description,
        imageUrl: mediaUrl,
      };
      
      // Call API to update campaign metadata
      await updateCampaign(updatedData);
      
      toast.success("Campaign details updated successfully");
      setEditing(false);
      
      // Update local state
      setCampaign({
        ...campaign,
        title: title,
        description: description,
        imageUrl: mediaUrl
      });
      
      setSaving(false);
    } catch (err) {
      console.error("Error updating campaign:", err);
      toast.error("Failed to update campaign details");
      setSaving(false);
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    if (editing) {
      // Reset values if canceling edit
      setTitle(campaign.title || "");
      setDescription(campaign.description || "");
      setMediaUrl(campaign.imageUrl || campaign.media?.[0] || "");
    }
    setEditing(!editing);
  };
  
  // Format values
  const progress = campaign ? calculateProgress(
    campaign.totalFunded || campaign.amountRaised || 0, 
    campaign.goalAmount || 0
  ) : 0;
  
  const formattedGoalAmount = campaign ? formatBlockchainValue(campaign.goalAmount || 0) : "0";
  const formattedRaised = campaign ? formatBlockchainValue(campaign.totalFunded || campaign.amountRaised || 0) : "0";
  const formattedCategory = campaign ? formatCategory(campaign.category || 0) : "";
  
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Back button and page title */}
        <div className="flex items-center mb-8">
          <Link href="/my-campaigns" className="mr-4">
            <Button variant="outline" size="icon" className="rounded-full border-black dark:border-white">
              <ArrowLeft className="h-5 w-5 text-black dark:text-white" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-black dark:text-white">Manage Campaign</h1>
        </div>
        
        {/* Wallet Not Connected State */}
        {!isWalletConnected && (
          <div className="bg-white border-2 border-black text-black p-6 rounded-lg mb-6 dark:bg-black dark:text-white dark:border-white">
            <div className="flex flex-col items-center text-center">
              <Wallet className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">Connect Your Wallet</h3>
              <p className="mb-4">You need to connect your wallet to manage your campaign.</p>
              <Button 
                onClick={connectWallet}
                className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-md transition-all dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Connect Wallet
              </Button>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {isWalletConnected && loading && (
          <div className="w-full py-12 flex justify-center">
            <div className="animate-spin h-10 w-10 border-4 border-black dark:border-white border-t-transparent rounded-full"></div>
          </div>
        )}
        
        {/* Error State */}
        {isWalletConnected && error && (
          <div className="bg-white border-2 border-red-500 text-black p-6 rounded-lg mb-6 dark:bg-black dark:text-white">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-500 mb-2">Error</h3>
                <p className="mb-4">{error}</p>
                <Link href="/my-campaigns">
                  <Button className="bg-red-500 hover:bg-red-600 text-white">
                    Back to My Campaigns
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content - Campaign Management */}
        {isWalletConnected && !loading && !error && campaign && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Campaign Details */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-black dark:text-white">Campaign Details</CardTitle>
                    <CardDescription>
                      Edit the details of your campaign that can be modified after creation
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={toggleEditMode} 
                    className="border-black dark:border-white text-black dark:text-white"
                    disabled={saving}
                  >
                    {editing ? (
                      <>Cancel <Edit className="ml-2 h-4 w-4" /></>
                    ) : (
                      <>Edit <Edit className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-6">
                    {/* Campaign Image */}
                    {mediaUrl && !editing && (
                      <div className="rounded-lg overflow-hidden h-64 relative">
                        <Image
                          src={mediaUrl}
                          alt={title}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    )}
                    
                    {/* Editable Form */}
                    {editing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-black dark:text-white">
                            Campaign Title
                          </label>
                          <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="border-black dark:border-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block mb-2 text-sm font-medium text-black dark:text-white">
                            Description
                          </label>
                          <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            className="border-black dark:border-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block mb-2 text-sm font-medium text-black dark:text-white">
                            Media URL
                          </label>
                          <Input
                            value={mediaUrl}
                            onChange={(e) => setMediaUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="border-black dark:border-white"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Enter a URL for your campaign image or media
                          </p>
                        </div>
                        
                        <div className="pt-4">
                          <Button 
                            onClick={handleSaveChanges} 
                            disabled={saving}
                            className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-white dark:border-black border-t-transparent rounded-full mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-bold text-black dark:text-white mb-2">{title}</h3>
                          <p className="text-black dark:text-white whitespace-pre-wrap">{description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Tabs defaultValue="milestones">
                <TabsList className="border-2 border-black dark:border-white">
                  <TabsTrigger value="milestones">Milestones</TabsTrigger>
                  <TabsTrigger value="backers">Backers</TabsTrigger>
                  <TabsTrigger value="updates">Updates</TabsTrigger>
                </TabsList>
                
                <TabsContent value="milestones">
                  <Card className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl text-black dark:text-white">Campaign Milestones</CardTitle>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center">
                                <Lock className="h-4 w-4 text-black dark:text-white mr-2" />
                                <span className="text-sm text-black dark:text-white">Blockchain Data</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Milestone data is stored on the blockchain and cannot be modified after creation</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {campaign.milestones && campaign.milestones.length > 0 ? (
                        <div className="space-y-4">
                          {campaign.milestones.map((milestone: any, index: number) => (
                            <div key={index} className="border-2 border-black dark:border-white p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-black dark:text-white">{milestone.name || milestone.title || `Milestone ${index + 1}`}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  milestone.isCompleted 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                                }`}>
                                  {milestone.isCompleted ? 'Completed' : 'In Progress'}
                                </span>
                              </div>
                              <p className="text-sm text-black dark:text-white mb-2">
                                {milestone.description || "No description provided"}
                              </p>
                              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                <span>Target: {formatBlockchainValue(milestone.targetAmount || milestone.amount || 0)} TLOS</span>
                                {milestone.deadline && (
                                  <span>Deadline: {new Date(milestone.deadline * 1000).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">No milestones found for this campaign</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="backers">
                  <Card className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    <CardHeader>
                      <CardTitle className="text-xl text-black dark:text-white">Campaign Backers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Implement backers list when available */}
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">Backer information will be available as your campaign receives funding</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="updates">
                  <Card className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl text-black dark:text-white">Campaign Updates</CardTitle>
                        <Button variant="outline" className="border-black dark:border-white text-black dark:text-white">
                          Post Update
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Implement updates when available */}
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">You haven't posted any updates for this campaign yet</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Right Column - Campaign Stats & Actions */}
            <div>
              <Card className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] mb-6 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-xl text-black dark:text-white">Campaign Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm text-black dark:text-white mb-2">
                        <span>Progress</span>
                        <span className="font-semibold">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5">
                        <div
                          className="bg-black dark:bg-white h-2.5 rounded-full"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-black dark:text-white mt-2">
                        <span>{formattedRaised} TLOS raised</span>
                        <span>Goal: {formattedGoalAmount} TLOS</span>
                      </div>
                    </div>
                    
                    <Separator className="bg-gray-200 dark:bg-gray-800" />
                    
                    {/* Campaign Info */}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Category</span>
                        <span className="font-medium text-black dark:text-white">{formattedCategory}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Status</span>
                        <span className="font-medium text-black dark:text-white">
                          {progress >= 100 ? 'Funded' : campaign.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Created</span>
                        <span className="font-medium text-black dark:text-white">
                          {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Campaign ID</span>
                        <span className="font-medium text-black dark:text-white">{campaign.id}</span>
                      </div>
                    </div>
                    
                    <Separator className="bg-gray-200 dark:bg-gray-800" />
                    
                    {/* Immutable Data Notice */}
                    <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-start">
                        <HelpCircle className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-black dark:text-white mb-1">Blockchain Stored Data</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Some campaign data is stored on the blockchain and cannot be modified after creation, including goal amount, 
                            milestones, and beneficiaries. Off-chain data like title, description, and images can be updated.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Link href={`/campaign/${campaign.id}`} className="block">
                        <Button className="w-full bg-black hover:bg-gray-800 text-white font-bold dark:bg-white dark:text-black dark:hover:bg-gray-200">
                          View Public Page
                        </Button>
                      </Link>
                      
                      <Button className="w-full bg-white hover:bg-gray-100 text-black font-bold border-2 border-black dark:bg-black dark:text-white dark:hover:bg-gray-900 dark:border-white" variant="outline">
                        Export Campaign Data
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 