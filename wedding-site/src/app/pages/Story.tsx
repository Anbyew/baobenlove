export function Story() {
  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <img 
          src="/assets/backgrounds/bg3.jpg"
          alt="Garden background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/40" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative py-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-sm" />
            <div className="relative">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-12 animate-elegant-fade-in" />
              <h1 className="text-5xl md:text-7xl font-light mb-6 text-foreground tracking-tight animate-slide-in-left">Our Story</h1>
              <p className="text-xl font-light text-foreground/80 animate-slide-up-delayed">A journey written in the stars</p>
            </div>
          </div>
        </div>

        {/* Content Panel with White Background */}
        <div className="max-w-4xl mx-auto px-4 pb-32">
          <div className="bg-white/85 backdrop-blur-md shadow-2xl shadow-black/5 p-8 md:p-16 rounded-sm">
            {/* How We Met */}
            <div className="mb-32">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-light text-foreground mb-8 animate-slide-up-scale" style={{ animationDelay: '0.2s' }}>How We Met</h2>
                <div className="h-px w-12 bg-primary/30 mx-auto animate-elegant-fade-in" style={{ animationDelay: '0.4s' }} />
              </div>
              <div className="space-y-6 text-center max-w-3xl mx-auto">
                <p className="text-lg font-light text-foreground/90 leading-relaxed animate-slide-up-delayed-2">
                  Our paths first crossed in the hallways of medical school in 2018. Both driven by a passion
                  for helping others and a love for scientific discovery, we found ourselves drawn to each other's
                  dedication and warm personalities.
                </p>
                <p className="text-lg font-light text-foreground/90 leading-relaxed animate-slide-up-delayed-3">
                  What started as study partners during grueling exam seasons evolved into coffee dates,
                  then long walks discussing everything from molecular biology to our favorite books. We discovered
                  a connection that went far beyond textbooks and lectures.
                </p>
              </div>
            </div>

            {/* Growing Together */}
            <div className="mb-32">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-light text-foreground mb-8 animate-slide-up-scale" style={{ animationDelay: '0.5s' }}>Growing Together</h2>
                <div className="h-px w-12 bg-secondary/30 mx-auto animate-elegant-fade-in" style={{ animationDelay: '0.6s' }} />
              </div>
              <div className="space-y-6 text-center max-w-3xl mx-auto">
                <p className="text-lg font-light text-foreground/90 leading-relaxed animate-slide-up-delayed-4">
                  Through residency programs, late-night hospital shifts, and the challenges of building our
                  careers, we supported each other every step of the way. Our relationship grew stronger with
                  each obstacle we faced together.
                </p>
                <p className="text-lg font-light text-foreground/90 leading-relaxed animate-slide-up-delayed-5">
                  We found joy in the simple moments – cooking dinner together after long shifts, exploring
                  botanical gardens on weekends, and planning future adventures around the world.
                </p>
              </div>
            </div>

            {/* The Proposal */}
            <div className="mb-16">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-light text-foreground mb-8 animate-slide-up-scale" style={{ animationDelay: '0.7s' }}>The Proposal</h2>
                <div className="h-px w-12 bg-primary/30 mx-auto animate-elegant-fade-in" style={{ animationDelay: '0.8s' }} />
              </div>
              <div className="space-y-6 text-center max-w-3xl mx-auto">
                <p className="text-lg font-light text-foreground/90 leading-relaxed animate-slide-up-delayed-6">
                  On a beautiful spring evening at the Philadelphia Botanical Gardens in 2025, surrounded by
                  blooming flowers and the golden light of sunset, Benjamin got down on one knee.
                </p>
                <p className="text-lg font-light text-foreground/90 leading-relaxed animate-slide-up-delayed" style={{ animationDelay: '1.3s' }}>
                  With a ring that sparkled as brightly as our future together, he asked the question that
                  would forever change our lives. Through happy tears and an overflowing heart, Yuwei said yes.
                </p>
                <p className="text-lg font-light text-primary/90 leading-relaxed mt-8 italic animate-elegant-fade-in" style={{ animationDelay: '1.5s' }}>
                  And now, we can't wait to celebrate this next beautiful chapter with all of you at
                  Longwood Gardens, where our story continues...
                </p>
              </div>
            </div>

            {/* Decorative ending */}
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto mt-24 animate-elegant-fade-in" style={{ animationDelay: '1.7s' }} />
          </div>
        </div>
      </div>
    </div>
  );
}