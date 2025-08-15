
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a clean, readable font
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
// import { Providers } from './providers'; // No longer using the generic Providers component
import InstagramBrowserPrompt from '@/components/InstagramBrowserPrompt';
import GlobalAdScripts from '@/components/GlobalAdScripts';
import SocialBarAdDisplay from '@/components/SocialBarAdDisplay'; // Import SocialBarAdDisplay
import { AdSettingsProvider } from '@/contexts/AdSettingsContext';
import { AIProfileProvider } from '@/contexts/AIProfileContext';
import { GlobalStatusProvider } from '@/contexts/GlobalStatusContext';
import { AIMediaAssetsProvider } from '@/contexts/AIMediaAssetsContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Kruthika Chat - Your AI Companion',
  description: 'Chat with Kruthika, your friendly and engaging AI companion. Experience a unique AI chat with Kruthika, sometimes referred to as an AI girlfriend experience for companionship.',
  keywords: 'Kruthika, Kruthika Chat, AI Chat, AI girlfriend, virtual companion, chat bot, AI companion, conversational AI',
  openGraph: {
    title: 'Kruthika Chat - Your AI Companion',
    description: 'Chat with Kruthika, your friendly and engaging AI companion. Experience a unique AI chat with Kruthika, sometimes referred to as an AI girlfriend experience for companionship.',
    siteName: 'Kruthika Chat',
    type: 'website',
    // Add a placeholder image URL. Replace with your actual image URL.
    // images: ['https://yourwebsite.com/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* <Providers> Removed this generic wrapper */}
          <AdSettingsProvider>
            <AIProfileProvider>
              <GlobalStatusProvider>
                <AIMediaAssetsProvider>
                  {/* Component to prompt users opening the site via Instagram's in-app browser */}
                  <InstagramBrowserPrompt />
                  {/* Component for global ad scripts (e.g., Google AdSense) */}
                  <GlobalAdScripts />
                  {children}
                  {/* Component to display social bar ads, present on all pages */}
                  <SocialBarAdDisplay />
                  {/* Component for displaying toasts (notifications) globally */}
                  <Toaster />
                </AIMediaAssetsProvider>
              </GlobalStatusProvider>
            </AIProfileProvider>
          </AdSettingsProvider>
        {/* </Providers> */}
      </body>
    </html>
  );
}
