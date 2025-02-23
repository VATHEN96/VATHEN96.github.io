/**
 * Fetches all campaigns from the smart contract
 */
const fetchCampaigns = useCallback(async (): Promise<Campaign[]> => {
    setLoading(true);
    try {
        if (typeof window.ethereum !== "undefined") {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await window.ethereum.request({ method: "eth_requestAccounts" });

            const signer = provider.getSigner();
            const contract = new ethers.Contract(
                contractAddress,
                contractABI,
                signer
            );

            const campaignCounter = await contract.campaignCounter();

            if (Number(campaignCounter) === 0) {
                setCampaigns([]);
                return [];
            }

            const campaignPromises = [];
            for (let i = 0; i < Number(campaignCounter); i++) {
                campaignPromises.push(contract.getCampaignMetadata(i));
            }

            const rawCampaigns = await Promise.all(campaignPromises);
            const parsedCampaigns: Campaign[] = rawCampaigns.map(
                (campaign: any) => ({
                    id: campaign.id.toString(),
                    creator: campaign.creator,
                    title: campaign.title,
                    description: campaign.description,
                    goalAmount: Number(ethers.utils.formatEther(campaign.goalAmount)),
                    totalFunded: Number(ethers.utils.formatEther(campaign.totalFunded)),
                    deadline: new Date(campaign.deadline.toNumber() * 1000),
                    milestones: campaign.milestones.map(
                        (ms: any, index: number): Milestone => ({
                            id: ms.id ? ms.id.toString() : `milestone-${index}`,
                            name: ms.name,
                            target: Number(ethers.utils.formatEther(ms.target)),
                            completed: ms.completed,
                            dueDate: ms.dueDate
                                ? new Date(ms.dueDate.toNumber() * 1000)
                                : undefined,
                        })
                    ),
                    category: campaign.category,
                    beneficiaries: campaign.beneficiaries,
                    proofOfWork: campaign.proofOfWork,
                    collateral: campaign.collateral,
                    multimedia: campaign.multimedia,
                    isActive: campaign.isActive,
                    createdAt: new Date(campaign.createdAt),
                    duration: Number(campaign.duration),
                })
            );
            setCampaigns(parsedCampaigns);
            return parsedCampaigns;
        } else {
            setError("No Ethereum provider found. Please install MetaMask.");
            return [];
        }
    } catch (err: any) {
        setError(err.reason || err.message || "Failed to fetch campaigns");
        return [];
    } finally {
        setLoading(false);
    }
}, []);
