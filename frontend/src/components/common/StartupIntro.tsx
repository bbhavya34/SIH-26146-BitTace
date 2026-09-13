import React, { useEffect, useRef, useState } from 'react';

interface StartupIntroProps {
  onReveal: () => void;
  onComplete: () => void;
}

export const StartupIntro: React.FC<StartupIntroProps> = ({ onReveal, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isExiting, setIsExiting] = useState(false);
  const completionStarted = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.play().catch(handleComplete);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleComplete();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleComplete = () => {
    if (completionStarted.current) return;
    completionStarted.current = true;
    onReveal();
    setIsExiting(true);
    window.setTimeout(onComplete, 700);
  };

  return (
    <div className={`bittrace-intro${isExiting ? ' is-exiting' : ''}`}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleComplete}
        onError={handleComplete}
        src="/bittrace-startup.mp4"
      />
      {!isExiting && (
        <button type="button" className="bittrace-intro-skip" onClick={handleComplete}>
          Skip animation
        </button>
      )}
    </div>
  );
};