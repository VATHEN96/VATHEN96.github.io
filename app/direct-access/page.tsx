"use client";

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar';

export default function SystemRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Silent redirect to Campaign 0
    router.push('/campaign/0?formatted=true');
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4 text-black dark:text-white">
            Redirecting...
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You are being redirected to the requested campaign. If you are not redirected automatically, please click the link below.
          </p>
          
          <Link
            href="/campaign/0?formatted=true"
            className="inline-block py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
          >
            Go to Campaign
          </Link>
          
          <div className="mt-8">
            <Link
              href="/"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 