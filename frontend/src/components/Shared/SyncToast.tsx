import { useEffect, useRef, useState } from 'react';

interface SyncToastProps {
  message: string;
  duration?: number; // ms
}

export const SyncToast: React.FC<SyncToastProps> = ({ message, duration = 2500 }) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), duration);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [message, duration]);

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 16,
        transform: 'translateX(-50%)',
        background: '#263445', // solid, dark blue-gray
        color: '#fff',
        border: 'none',
        borderRadius: 10,
        padding: '16px 20px',
        fontSize: 18,
        fontWeight: 600,
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
        zIndex: 3000,
        transition: 'opacity 0.4s cubic-bezier(.4,0,.2,1)',
        width: '92vw',
        maxWidth: 600,
        minWidth: 0,
        textAlign: 'center',
        wordBreak: 'break-word',
      }}
      aria-live="polite"
    >
      {message}
    </div>
  );
};
