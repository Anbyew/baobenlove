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

        {/* Overlay text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-white text-center drop-shadow-lg">
            <p className="text-sm tracking-widest uppercase mb-4 opacity-80">Scroll to explore</p>
            <h1 className="text-6xl font-light">Yuwei &amp; Benjamin</h1>
            <p className="mt-4 text-xl tracking-wide opacity-70">October 3, 2026</p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60 text-xs tracking-widest uppercase">
          <span>Scroll</span>
          <div className="w-px h-8 bg-white/40 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
