"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Navbar from '@/components/navbar'
import { useWowzarush } from '@/context/wowzarushContext'
import { v4 as uuidv4 } from 'uuid'
import { Campaign as CampaignInterface } from "../../utils/contextInterfaces"

export default function CreateCampaign() {
    const { loading, createCampaign } = useWowzarush();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        goal: '',
        duration: '',
        category: '',
        milestones: [{ name: 'Initial Milestone', target: '' }],
        beneficiaries: '',
        proofOfWork: '',
        collateral: '',
        multimedia: '', // expecting a URL string in this case
    });

    // Updated formErrors to include 'loading'
    const [formErrors, setFormErrors] = useState({
        title: false,
        description: false,
        goal: false,
        duration: false,
        category: false,
        beneficiaries: false,
        proofOfWork: false,
        milestones: false,
        loading: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    }

    const handleMilestoneChange = (index: number, field: string, value: string) => {
        const newMilestones = [...formData.milestones];
        newMilestones[index] = { ...newMilestones[index], [field]: value };
        setFormData(prevState => ({
            ...prevState,
            milestones: newMilestones,
        }));
    }

    const addMilestone = () => {
        setFormData(prevState => ({
            ...prevState,
            milestones: [...prevState.milestones, { name: '', target: '' }]
        }));
    }

    const removeMilestone = (index: number) => {
        if (formData.milestones.length <= 1) {
            return; // Prevent removing the last milestone
        }
        const newMilestones = formData.milestones.filter((_, i) => i !== index);
        setFormData(prevState => ({
            ...prevState,
            milestones: newMilestones,
        }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Form validation
        const hasValidMilestones = formData.milestones.every(
            milestone => milestone.name.trim() && milestone.target
        );
        const totalMilestoneTargets = formData.milestones.reduce(
            (sum, milestone) => sum + Number(milestone.target),
            0
        );

        if (
            !formData.title ||
            !formData.description ||
            !formData.goal ||
            !formData.duration ||
            !formData.category ||
            !formData.beneficiaries ||
            !formData.proofOfWork ||
            !hasValidMilestones ||
            totalMilestoneTargets > Number(formData.goal)
        ) {
            setFormErrors({
                title: !formData.title,
                description: !formData.description,
                goal: !formData.goal,
                duration: !formData.duration,
                category: !formData.category,
                beneficiaries: !formData.beneficiaries,
                proofOfWork: !formData.proofOfWork,
                milestones: !hasValidMilestones || totalMilestoneTargets > Number(formData.goal),
                loading: false,
            });
            return;
        }

        // Set loading state in formErrors
        setFormErrors({ ...formErrors, loading: true });

        try {
            // Calculate deadline by adding the duration (in days) to the current date.
            const duration = Number(formData.duration);
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + duration);

            // Transform formData into campaignData with the proper shape.
            // Note: We omit totalFunded since createCampaign expects Omit<Campaign, "id" | "totalFunded">
            const campaignData: CampaignInterface = {
                id: uuidv4(),
                title: formData.title,
                description: formData.description,
                goalAmount: Number(formData.goal),
                totalFunded: 0,
                deadline: deadline,
                creator: "0xYourConnectedAccount", // Replace with actual account if available
                milestones: formData.milestones.map((milestone, index) => ({
                    id: `milestone-${index}`, // Temporary ID; generate a unique one if needed
                    name: milestone.name,
                    target: Number(milestone.target),
                    completed: false, // New campaigns start with milestones not completed
                })),
                category: formData.category,
                beneficiaries: formData.beneficiaries.split(',').map(b => b.trim()),
                proofOfWork: formData.proofOfWork,
                collateral: formData.collateral,
                multimedia: formData.multimedia ? formData.multimedia.toString() : '',
                duration: duration,         // New property: campaign duration (in days)
                isActive: true,             // New property: assume new campaign is active
                createdAt: new Date(),      // New property: set creation date to current time
            };

            // Now pass the transformed data
            await createCampaign(campaignData);
            alert('Campaign created successfully!');
        } catch (error) {
            console.error('Campaign creation failed:', error);
            alert('An error occurred. Please try again later.');
        } finally {
            setFormErrors({ ...formErrors, loading: false });
        }
    };

    const getFormProgress = () => {
        const requiredFields = [
            formData.title,
            formData.description,
            formData.goal,
            formData.duration,
            formData.category,
            formData.beneficiaries,
            formData.proofOfWork
        ];

        const filledFields = requiredFields.filter(Boolean).length;
        const hasValidMilestones = formData.milestones.every(
            milestone => milestone.name && milestone.target
        );

        return Math.round((filledFields + (hasValidMilestones ? 1 : 0)) / (requiredFields.length + 1) * 100);
    };

    return (
        <div className="min-h-screen bg-[#FFFDF6]">
            <Navbar />
            <main className="container mx-auto px-4 pt-24 pb-12">
                <Link href="/" className="inline-flex items-center text-black hover:text-[#3498db] mb-6 transition-colors">
                    <ArrowLeft className="mr-2" />
                    Back to Home
                </Link>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-2xl mx-auto bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                >
                    <h1 className="text-3xl font-bold mb-6 text-center">Create Your Campaign</h1>
                    <div className="mb-8">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-blue-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${getFormProgress()}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-2 text-center">
                            Fill in all required fields to create your campaign
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Fields with error display */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                Campaign Title
                            </label>
                            <Input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className={`w-full border-2 ${formErrors.title ? 'border-red-500' : 'border-black'}`}
                            />
                            {formErrors.title && <span className="text-red-500 text-xs">Title is required</span>}
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                className="w-full border-2 border-black"
                                rows={4}
                            />
                        </div>
                        <div>
                            <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-1">
                                Funding Goal (TLOS)
                            </label>
                            <Input
                                type="number"
                                id="goal"
                                name="goal"
                                value={formData.goal}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                className="w-full border-2 border-black"
                            />
                        </div>
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                                Campaign Duration (days)
                            </label>
                            <Input
                                type="number"
                                id="duration"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                required
                                min="1"
                                max="365"
                                className="w-full border-2 border-black"
                            />
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="w-full border-2 border-black rounded-md shadow-sm p-2"
                            >
                                <option value="">Select a category</option>
                                <option value="technology">Technology & Innovation</option>
                                <option value="health">Health & Wellness</option>
                                <option value="education">Education & Learning</option>
                                <option value="social">Social Impact & Causes</option>
                                <option value="art">Art & Culture</option>
                                <option value="film">Film & Entertainment</option>
                                <option value="music">Music & Audio</option>
                                <option value="gaming">Gaming</option>
                                <option value="science">Science & Research</option>
                                <option value="food">Food & Culinary</option>
                                <option value="sports">Sports & Fitness</option>
                                <option value="travel">Travel & Adventure</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Dynamic Milestones */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700">
                                    Milestones <span className="text-red-500">*</span>
                                </label>
                                <span className="text-sm text-gray-500">At least one milestone required</span>
                            </div>

                            <div className="space-y-4 p-4 bg-gray-50 border-2 border-black rounded-md">
                                {formData.milestones.map((milestone, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 mb-1 block">
                                                Milestone {index + 1} Name
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="e.g., Development Phase 1"
                                                value={milestone.name}
                                                onChange={(e) => handleMilestoneChange(index, 'name', e.target.value)}
                                                required
                                                className="border-2 border-black"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 mb-1 block">
                                                Target Amount (TLOS)
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={milestone.target}
                                                onChange={(e) => handleMilestoneChange(index, 'target', e.target.value)}
                                                required
                                                min="0"
                                                step="0.01"
                                                className="border-2 border-black"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => removeMilestone(index)}
                                            className="self-end bg-red-500 hover:bg-red-600 text-white"
                                            disabled={formData.milestones.length <= 1}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    onClick={addMilestone}
                                    className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white"
                                >
                                    Add Another Milestone
                                </Button>
                            </div>
                        </div>

                        {/* Beneficiaries */}
                        <div>
                            <label htmlFor="beneficiaries" className="block text-sm font-medium text-gray-700 mb-1">
                                Target Audience/Beneficiaries
                            </label>
                            <Textarea
                                id="beneficiaries"
                                name="beneficiaries"
                                value={formData.beneficiaries}
                                onChange={handleChange}
                                required
                                className="w-full border-2 border-black"
                                rows={3}
                            />
                        </div>

                        {/* Proof of Work */}
                        <div>
                            <label htmlFor="proofOfWork" className="block text-sm font-medium text-gray-700 mb-1">
                                Proof of Work (URL or Description)
                            </label>
                            <Input
                                type="text"
                                id="proofOfWork"
                                name="proofOfWork"
                                value={formData.proofOfWork}
                                onChange={handleChange}
                                required
                                className="w-full border-2 border-black"
                            />
                        </div>

                        {/* Collateral */}
                        <div>
                            <label htmlFor="collateral" className="block text-sm font-medium text-gray-700 mb-1">
                                Collateral (if applicable)
                            </label>
                            <Input
                                type="text"
                                id="collateral"
                                name="collateral"
                                value={formData.collateral}
                                onChange={handleChange}
                                className="w-full border-2 border-black"
                            />
                        </div>

                        {/* Multimedia */}
                        <div>
                            <label htmlFor="multimedia" className="block text-sm font-medium text-gray-700 mb-1">
                                Multimedia Link (URL)
                            </label>
                            <Input
                                type="text"
                                id="multimedia"
                                name="multimedia"
                                value={formData.multimedia}
                                onChange={handleChange}
                                placeholder="Enter a URL for multimedia (e.g., YouTube, Vimeo, etc.)"
                                className="w-full border-2 border-black"
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className={`w-full ${loading ? 'bg-gray-500' : 'bg-yellow-400'} hover:bg-yellow-500 text-black font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Create Campaign'}
                        </Button>
                    </form>
                </motion.div>
            </main>
        </div>
    );
}

