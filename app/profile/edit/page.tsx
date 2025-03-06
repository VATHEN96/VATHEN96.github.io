'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWowzaRush } from '@/context/wowzarushContext';
import Navbar from '@/components/navbar';
import VerificationRequest from '@/components/VerificationRequest';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EditProfilePage() {
  const router = useRouter();
  const { isWalletConnected, account, getCreatorProfile, updateCreatorProfile } = useWowzaRush();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [profile, setProfile] = useState({
    displayName: '',
    bio: '',
    profileImageUrl: '',
    socialLinks: {
      website: '',
      twitter: '',
      github: '',
      linkedin: ''
    }
  });
  
  useEffect(() => {
    const loadProfile = async () => {
      if (!isWalletConnected || !account) {
        setLoading(false);
        return;
      }
      
      try {
        const creatorProfile = await getCreatorProfile(account);
        
        if (creatorProfile) {
          setProfile({
            displayName: creatorProfile.displayName || '',
            bio: creatorProfile.bio || '',
            profileImageUrl: creatorProfile.profileImageUrl || '',
            socialLinks: {
              website: creatorProfile.socialLinks?.website || '',
              twitter: creatorProfile.socialLinks?.twitter || '',
              github: creatorProfile.socialLinks?.github || '',
              linkedin: creatorProfile.socialLinks?.linkedin || ''
            }
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load your profile');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [isWalletConnected, account, getCreatorProfile]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('social-')) {
      const socialName = name.replace('social-', '');
      setProfile(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialName]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isWalletConnected || !account) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    setSaving(true);
    
    try {
      await updateCreatorProfile({
        displayName: profile.displayName,
        bio: profile.bio,
        profileImageUrl: profile.profileImageUrl,
        socialLinks: profile.socialLinks
      });
      
      toast.success('Profile updated successfully');
      
      // Redirect to profile page after a short delay
      setTimeout(() => {
        router.push(`/profile`);
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-20 px-4">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-10">
              <div className="flex flex-col items-center justify-center">
                <AlertCircle className="h-8 w-8 text-orange-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Wallet Not Connected</h2>
                <p className="text-gray-500 mb-6">Please connect your wallet to edit your profile</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Creator Profile</h1>
        
        <Tabs defaultValue="profile" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="verification">Verification & Trust</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card className="w-full max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>
                  Update your public profile information that will be visible to contributors
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          name="displayName"
                          placeholder="Your display name"
                          value={profile.displayName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          placeholder="Tell contributors about yourself..."
                          value={profile.bio}
                          onChange={handleInputChange}
                          rows={4}
                        />
                        <p className="text-xs text-gray-500">
                          Brief description of who you are and what you create
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="profileImageUrl">Profile Image URL</Label>
                        <Input
                          id="profileImageUrl"
                          name="profileImageUrl"
                          placeholder="https://example.com/your-image.jpg"
                          value={profile.profileImageUrl}
                          onChange={handleInputChange}
                        />
                        <p className="text-xs text-gray-500">
                          Link to an image for your profile (recommended: 200x200px)
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <Label>Social Links</Label>
                        
                        <div className="space-y-2">
                          <Label htmlFor="social-website" className="text-sm">Website</Label>
                          <Input
                            id="social-website"
                            name="social-website"
                            placeholder="https://yourwebsite.com"
                            value={profile.socialLinks.website}
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="social-twitter" className="text-sm">Twitter</Label>
                          <Input
                            id="social-twitter"
                            name="social-twitter"
                            placeholder="https://twitter.com/username"
                            value={profile.socialLinks.twitter}
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="social-github" className="text-sm">GitHub</Label>
                          <Input
                            id="social-github"
                            name="social-github"
                            placeholder="https://github.com/username"
                            value={profile.socialLinks.github}
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="social-linkedin" className="text-sm">LinkedIn</Label>
                          <Input
                            id="social-linkedin"
                            name="social-linkedin"
                            placeholder="https://linkedin.com/in/username"
                            value={profile.socialLinks.linkedin}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => router.push('/profile')}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  
                  <Button type="submit" disabled={loading || saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="verification">
            <VerificationRequest />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 