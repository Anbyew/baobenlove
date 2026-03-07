import { useLang } from '../context/LanguageContext';

export function Home() {
  const { t } = useLang();
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="/assets/backgrounds/bg1.jpg"
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
            {t.name1}
          </h1>
          <div className="text-3xl md:text-4xl text-secondary/80 font-light my-6 animate-slide-up-scale" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>&</div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-foreground tracking-tight animate-slide-in-right" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            {t.name2}
          </h1>
        </div>

        {/* Latin Phrase */}
        <div className="my-16 animate-elegant-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
          <p className="text-2xl md:text-3xl lg:text-4xl text-primary/80 tracking-wide italic-accent">
            {t.latinPhrase}
          </p>
        </div>

        {/* Date & Location */}
        <div className="space-y-6 my-20 animate-slide-up-scale" style={{ animationDelay: '0.9s', animationFillMode: 'both' }}>
          <div className="text-3xl md:text-4xl font-light text-foreground tracking-wider">
            {t.date}
          </div>
          <div className="h-px w-8 bg-primary/30 mx-auto" />
          <div className="text-xl md:text-2xl font-light text-foreground/90">
            {t.venue}
          </div>
          <div className="text-lg md:text-xl font-light text-foreground/80">
            {t.location}
          </div>
        </div>

        {/* Minimal decorative line */}
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto my-16 animate-elegant-fade-in" style={{ animationDelay: '1.2s', animationFillMode: 'both' }} />

      </div>

      {/* Minimal scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-30">
        <div className="w-px h-16 bg-gradient-to-b from-foreground/30 to-transparent" />
      </div>
    </div>
  );
}