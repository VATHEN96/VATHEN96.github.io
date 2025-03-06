'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Import components dynamically
const Hero = dynamic(() => import('./Hero'), { ssr: false });
const Features = dynamic(() => import('./Features'), { ssr: false });
const HowItWorks = dynamic(() => import('./HowItWorks'), { ssr: false });
const CTA = dynamic(() => import('./CTA'), { ssr: false });
const Partners = dynamic(() => import('./Partners'), { ssr: false });
const Testimonials = dynamic(() => import('./Testimonials'), { ssr: false });
const Community = dynamic(() => import('./Community'), { ssr: false });
const Footer = dynamic(() => import('./Footer'), { ssr: false });

export default function DynamicHomePage() {
  return (
    <main>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
        <Partners />
        <Testimonials />
        <Community />
        <Footer />
      </Suspense>
    </main>
  );
} 