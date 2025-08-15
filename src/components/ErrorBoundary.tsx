"use client";

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error }>;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for admin/debugging purposes only
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} />;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-4">Oops! Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              Maya seems to be having a little technical hiccup. Don't worry, she'll be back soon! 💕
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;