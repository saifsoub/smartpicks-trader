
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Component error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="p-4 rounded-md bg-red-900/20 border border-red-800 text-white">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
            <h3 className="font-semibold">Something went wrong</h3>
          </div>
          <p className="text-sm text-slate-300 mb-2">
            There was an error loading this component. Try refreshing the page.
          </p>
          <div className="mt-2 p-2 bg-slate-900/50 rounded text-xs text-red-300 font-mono overflow-auto max-h-24">
            {this.state.error?.toString()}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
