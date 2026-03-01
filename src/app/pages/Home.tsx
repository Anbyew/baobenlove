import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';

export function Home() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="/bg1.jpg"
          alt="Garden background"
          className="w-full h-full object-cover"
        />
        {/* Elegant overlay to ensure text readability */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
      </div>

      {/* Elegant geometric accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-24 w-96 h-96 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 py-32 max-w-6xl w-full animate-fade-in">
        {/* Minimal decorative line */}
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-16 animate-elegant-fade-in" />

        {/* Names - Large and elegant */}
        <div className="mb-8 space-y-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-foreground tracking-tight animate-slide-in-left">
            Yuwei Bao
          </h1>
          <div className="text-3xl md:text-4xl text-secondary/80 font-light my-6 animate-slide-up-scale" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>&</div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-foreground tracking-tight animate-slide-in-right" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            Benjamin Krakoff
          </h1>
        </div>

        {/* Latin Phrase */}
        <div className="my-16 animate-elegant-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
          <p className="text-2xl md:text-3xl lg:text-4xl text-primary/80 tracking-wide italic-accent">
            Optimum attingitur. Amor infinitus est.
          </p>
        </div>

        {/* Date & Location */}
        <div className="space-y-6 my-20 animate-slide-up-scale" style={{ animationDelay: '0.9s', animationFillMode: 'both' }}>
          <div className="text-3xl md:text-4xl font-light text-foreground tracking-wider">
            October 3, 2026
          </div>
          <div className="h-px w-8 bg-primary/30 mx-auto" />
          <div className="text-xl md:text-2xl font-light text-foreground/90">
            Longwood Gardens
          </div>
          <div className="text-lg md:text-xl font-light text-foreground/80">
            Kennett Square, Pennsylvania
          </div>
        </div>

        {/* Minimal decorative line */}
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto my-16 animate-elegant-fade-in" style={{ animationDelay: '1.2s', animationFillMode: 'both' }} />

        {/* CTA Buttons - minimal and elegant */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up-scale mt-16" style={{ animationDelay: '1.4s', animationFillMode: 'both' }}>
          <Link to="/rsvp">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white border-none shadow-none hover:shadow-lg transition-all duration-500 px-12 py-6 text-base tracking-widest uppercase font-light"
            >
              RSVP
              <ArrowRight className="ml-3 w-4 h-4" />
            </Button>
          </Link>
          <Link to="/details">
            <Button
              size="lg"
              variant="ghost"
              className="text-foreground/90 hover:text-foreground border border-foreground/30 hover:border-foreground/50 hover:bg-transparent transition-all duration-500 px-12 py-6 text-base tracking-widest uppercase font-light"
            >
              Details
            </Button>
          </Link>
        </div>
      </div>

      {/* Minimal scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-30">
        <div className="w-px h-16 bg-gradient-to-b from-foreground/30 to-transparent" />
      </div>
    </div>
  );
}