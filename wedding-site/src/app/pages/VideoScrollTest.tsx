import { useEffect, useRef } from 'react';

// Clip: grab roughly the middle third of the video
const CLIP_START_FRACTION = 0.01;
const CLIP_END_FRACTION = 0.99;

// Easing: ease-in-out-cubic — fast at start, slows in the middle, creeps at the end
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function VideoScrollTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef({ start: 0, end: 0 });

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    video.pause();

    let rafId: number;

    const onLoaded = () => {
      const dur = video.duration;
      clipRef.current = {
        start: dur * CLIP_START_FRACTION,
        end: dur * CLIP_END_FRACTION,
      };
      video.currentTime = clipRef.current.start;
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const containerHeight = container.offsetHeight - window.innerHeight;
        const scrolled = -rect.top;
        const rawProgress = Math.max(0, Math.min(1, scrolled / containerHeight));

        // Apply easing so it slows down as you scroll further
        const eased = easeInOutCubic(rawProgress);

        const { start, end } = clipRef.current;
        if (end > start) {
          video.currentTime = start + eased * (end - start);
        }
      });
    };

    video.addEventListener('loadedmetadata', onLoaded);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      video.removeEventListener('loadedmetadata', onLoaded);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ height: '500vh' }} className="relative">
      {/* Sticky video container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <video
          ref={videoRef}
          src="/backgrounds/vid4.mp4"
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="auto"
        />

      </div>
    </div>
  );
}
