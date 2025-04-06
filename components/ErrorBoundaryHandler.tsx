import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Specifically designed to handle blockchain and wallet connection errors
 */
class ErrorBoundaryHandler extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error("Error caught by boundary:", error);
    console.error("Component stack:", errorInfo.componentStack);
    
    // Update state with error info for displaying
    this.setState({ errorInfo });
    
    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Special handling for blockchain locker errors
    if (error.message?.includes('Breaking Browser Locker Behavior')) {
      console.warn('Blockchain locker behavior detected. This typically happens when wallet state changes during rendering.');
      
      // You could add analytics tracking here
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    });
  }

  handleReload = () => {
    window.location.reload();
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Show custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI
      return (
        <div className="p-6 border-2 border-yellow-300 rounded-lg bg-yellow-50">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <AlertCircle className="h-5 w-5" />
            <h2 className="text-lg font-medium">Something went wrong</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            There was an error loading this component. This might be related to blockchain connection issues.
          </p>
          
          {this.state.error && (
            <div className="mb-4 p-3 bg-white rounded border border-gray-200">
              <p className="text-red-500 text-sm font-mono">
                {this.state.error.toString()}
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button 
              onClick={this.handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </button>
            
            <button 
              onClick={this.handleReload}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundaryHandler; 