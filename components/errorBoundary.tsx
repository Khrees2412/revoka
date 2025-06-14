// components/ErrorBoundary.tsx
import { Component } from "react";

export class ErrorBoundary extends Component<{ children: React.ReactNode }> {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <h2 className="text-red-400">Something went wrong</h2>
                    <button onClick={() => window.location.reload()}>
                        Refresh Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
