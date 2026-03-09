'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

/**
 * Invisible watermark overlay for test users.
 * Renders the user's email + timestamp as near-invisible text across the screen.
 * This is visible in screenshots/recordings but invisible to the naked eye.
 */
export default function InvisibleWatermark() {
  const { data: session } = useSession();
  const [timestamp, setTimestamp] = useState('');
  const user = session?.user as any;
  const isTestUser = user?.isTestUser === true;

  useEffect(() => {
    if (!isTestUser) return;
    const update = () => setTimestamp(new Date().toISOString().slice(0, 19));
    update();
    const interval = setInterval(update, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [isTestUser]);

  if (!isTestUser || !user?.email) return null;

  const watermarkText = `${user.email} | ${user.id} | ${timestamp}`;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: 0.003, // Nearly invisible but shows in screenshots with contrast adjustment
        userSelect: 'none',
        mixBlendMode: 'multiply',
      }}
    >
      {/* Create a grid of watermark text across the entire screen */}
      {Array.from({ length: 12 }, (_, row) => (
        <div
          key={row}
          style={{
            position: 'absolute',
            top: `${row * 120}px`,
            left: 0,
            right: 0,
            display: 'flex',
            gap: '80px',
            transform: `rotate(-30deg) translateX(-200px)`,
            whiteSpace: 'nowrap',
          }}
        >
          {Array.from({ length: 6 }, (_, col) => (
            <span
              key={col}
              style={{
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#000',
                letterSpacing: '2px',
              }}
            >
              {watermarkText}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
