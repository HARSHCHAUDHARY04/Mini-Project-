import React from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-xl p-8 text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertOctagon className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-xl font-display font-semibold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              An unexpected application error occurred.
              {this.state.error?.message && (
                <code className="block mt-2 p-2 bg-slate-50 border border-slate-100 rounded text-xs text-red-700 font-mono text-left break-all max-h-24 overflow-y-auto">
                  {this.state.error.message}
                </code>
              )}
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 px-4 py-2 text-sm font-medium transition-all active:scale-[0.98]"
            >
              <RefreshCw size={15} />
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
