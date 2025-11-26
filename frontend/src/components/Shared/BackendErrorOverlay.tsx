import React, { useEffect, useState, useRef } from "react";

interface BackendErrorOverlayProps {
  errorMessage: string;
  onRetry: () => void;
  retryDelay?: number; // ms
}

const BackendErrorOverlay: React.FC<BackendErrorOverlayProps> = ({
  errorMessage,
  onRetry,
  retryDelay = 5000,
}) => {
  const [countdown, setCountdown] = useState(Math.floor(retryDelay / 1000));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCountdown(Math.floor(retryDelay / 1000));
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          onRetry();
          return Math.floor(retryDelay / 1000);
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [retryDelay, onRetry]);

  return (
    <div
      className="fixed inset-0 z-[5000] flex flex-col items-center justify-center bg-[color:var(--alert-error-bg,#fff3f3)] text-[color:var(--alert-error-text,#b71c1c)]"
      style={{ minHeight: "100vh", minWidth: "100vw" }}
      role="alertdialog"
      aria-modal="true"
    >
      <div className="flex flex-col items-center max-w-lg w-full px-6 py-10 rounded-xl shadow-2xl border border-[color:var(--alert-error-border,#e57373)] bg-white/90">
        <div className="text-5xl mb-4">⚠️</div>
        <h1
          className="text-2xl font-bold mb-2 text-center"
          style={{ color: "var(--alert-error-text)" }}
        >
          Unable to connect to the backend
        </h1>
        <p
          className="text-base mb-4 text-center"
          style={{ color: "var(--text-secondary)" }}
        >
          The app is having trouble reaching the server. This may be due to
          network issues or server downtime.
        </p>
        {errorMessage && (
          <div
            className="mb-4 text-sm text-center"
            style={{ color: "var(--alert-error-text)" }}
          >
            <strong>Error:</strong> {errorMessage}
          </div>
        )}
        <button
          className="mt-2 px-6 py-2 rounded bg-[color:var(--btn-primary-bg)] text-[color:var(--btn-primary-text)] font-semibold text-base hover:bg-[color:var(--btn-primary-bg-hover)] focus:outline-none focus:ring-2 focus:ring-[color:var(--btn-primary-bg)] transition"
          onClick={onRetry}
        >
          Retry now
        </button>
        <div className="mt-3 text-xs text-center text-[color:var(--text-secondary)]">
          Retrying automatically in{" "}
          <span className="font-semibold">{countdown}</span> seconds...
        </div>
      </div>
    </div>
  );
};

export default BackendErrorOverlay;
