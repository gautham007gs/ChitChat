import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import InstagramBrowserPrompt from '@/components/InstagramBrowserPrompt';
import GlobalAdScripts from '@/components/GlobalAdScripts';
import SocialBarAdDisplay from '@/components/SocialBarAdDisplay';
import { AdSettingsProvider } from '@/contexts/AdSettingsContext';
import { AIProfileProvider } from '@/contexts/AIProfileContext';
import { GlobalStatusProvider } from '@/contexts/GlobalStatusContext';
import { AIMediaAssetsProvider } from '@/contexts/AIMediaAssetsContext';
import ErrorBoundary from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Maya Chat - Your AI Companion',
  description: 'Chat with Maya, your friendly AI companion from Mumbai',
  keywords: 'AI chat, virtual companion, Maya, chatbot',
  authors: [{ name: 'Maya Chat Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Maya Chat - Your AI Companion',
    description: 'Chat with Maya, your friendly AI companion from Mumbai',
    type: 'website',
    url: 'https://your-domain.com',
    images: [
      {
        url: '/chat-bg.png',
        width: 1200,
        height: 630,
        alt: 'Maya Chat'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maya Chat - Your AI Companion',
    description: 'Chat with Maya, your friendly AI companion from Mumbai',
    images: ['/chat-bg.png']
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <ErrorBoundary>
          <GlobalStatusProvider>
            <AdSettingsProvider>
              <AIProfileProvider>
                <AIMediaAssetsProvider>
                  <div className="min-h-screen bg-background">
                    <InstagramBrowserPrompt />
                    <GlobalAdScripts />
                    <main className="relative">
                      {children}
                    </main>
                    <SocialBarAdDisplay />
                  </div>
                  <Toaster />
                </AIMediaAssetsProvider>
              </AIProfileProvider>
            </AdSettingsProvider>
          </GlobalStatusProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

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
        <InstagramBrowserPrompt />
        <ErrorBoundary>
          <AdSettingsProvider>
            <AIProfileProvider>
              <GlobalStatusProvider>
                <AIMediaAssetsProvider>
                  {/* Component for global ad scripts - now inside providers */}
                  <GlobalAdScripts />
                  {children}
                  {/* Component to display social bar ads, present on all pages */}
                  <SocialBarAdDisplay />
                </AIMediaAssetsProvider>
              </GlobalStatusProvider>
            </AIProfileProvider>
          </AdSettingsProvider>
        </ErrorBoundary>
        {/* Component for displaying toasts (notifications) globally */}
        <Toaster />
      </body>
    </html>
  );
}