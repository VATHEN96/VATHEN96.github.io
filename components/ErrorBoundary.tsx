'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child component tree
 * and display a fallback UI instead of crashing the whole application
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Here you could send error to your analytics or error reporting service
    // Example: sendToErrorReporting(error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleBack = (): void => {
    window.history.back();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                The application encountered an unexpected error.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground overflow-auto max-h-[200px] p-3 bg-muted rounded-md">
                {this.state.error && (
                  <p className="font-mono mb-2">{this.state.error.toString()}</p>
                )}
                {this.state.errorInfo && (
                  <details>
                    <summary className="cursor-pointer text-xs mb-2">View technical details</summary>
                    <pre className="text-xs overflow-auto p-2 bg-black/10 dark:bg-white/10 rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={this.handleBack} variant="outline">
                Go Back
              </Button>
              <Button onClick={this.handleReload}>
                Reload Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary; 