/**
 * SEO Utilities
 * 
 * Helper functions for generating consistent metadata for SEO
 */

import { Metadata } from 'next';

// Base site information
export const siteConfig = {
  name: 'WowzaRush',
  description: 'Transparent, milestone-based crowdfunding platform on the blockchain',
  url: 'https://wowzarush.io', // Replace with your production URL
  ogImage: 'https://wowzarush.io/images/og-image.jpg', // Replace with your OG image
  twitter: {
    handle: '@wowzarush',
    site: '@wowzarush',
    cardType: 'summary_large_image',
  },
};

// Helper function to generate metadata for different pages
export function generateMetadata({
  title,
  description,
  path,
  image,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
}): Metadata {
  const metaTitle = title 
    ? `${title} | ${siteConfig.name}` 
    : siteConfig.name;
  
  const metaDescription = description || siteConfig.description;
  const url = path ? `${siteConfig.url}${path}` : siteConfig.url;
  const ogImage = image || siteConfig.ogImage;

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: siteConfig.twitter.cardType,
      title: metaTitle,
      description: metaDescription,
      site: siteConfig.twitter.site,
      creator: siteConfig.twitter.handle,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// Generate schema markup for campaigns
export function generateCampaignSchema(campaign: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Project',
    name: campaign.title,
    description: campaign.description,
    image: campaign.image,
    dateCreated: new Date(campaign.createdAt).toISOString(),
    creator: {
      '@type': 'Person',
      name: campaign.creator.displayName,
      url: `${siteConfig.url}/profile/view?address=${campaign.creator.address}`,
    },
    funding: {
      '@type': 'MonetaryAmount',
      currency: 'TLOS',
      value: campaign.currentAmount,
    },
    url: `${siteConfig.url}/campaign/${campaign.id}`,
  };
}

// Generate schema markup for creators
export function generateCreatorSchema(profile: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.displayName,
    description: profile.bio,
    image: profile.profileImageUrl,
    url: `${siteConfig.url}/profile/view?address=${profile.address}`,
  };
} 