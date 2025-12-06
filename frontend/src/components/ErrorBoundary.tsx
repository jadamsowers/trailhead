import React from "react";

interface State {
  hasError: boolean;
  error?: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="p-6 rounded-lg" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-light)" }}>
            <h2 style={{ color: "var(--text-primary)" }}>Something went wrong</h2>
            <p style={{ color: "var(--text-secondary)" }} className="mt-2">An unexpected error occurred while rendering this page.</p>
            <pre className="mt-4 p-3 text-sm" style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)", overflowX: "auto" }}>
              {this.state.error?.message}
            </pre>
            <div className="mt-4">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={() => window.location.reload()}>Reload</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;
