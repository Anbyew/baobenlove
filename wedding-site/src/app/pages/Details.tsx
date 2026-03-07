import { Calendar, Clock, MapPin } from 'lucide-react';

export function Details() {
  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <img 
          src="/assets/backgrounds/bg2.jpg"
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
              <h1 className="text-5xl md:text-7xl font-light mb-6 text-foreground tracking-tight animate-slide-in-left">Details</h1>
              <p className="text-xl font-light text-foreground/80 animate-slide-up-delayed">Everything you need to know</p>
            </div>
          </div>
        </div>

        {/* Content Panel with White Background */}
        <div className="max-w-5xl mx-auto px-4 pb-32">
          <div className="bg-white/85 backdrop-blur-md shadow-2xl shadow-black/5 p-8 md:p-16 rounded-sm">
            {/* Ceremony */}
            <div className="mb-32">
              <div className="text-center mb-16">
                <div className="text-sm tracking-[0.3em] uppercase text-primary/60 mb-6 font-light animate-slide-up-delayed-2">Ceremony</div>
                <h2 className="text-3xl md:text-4xl font-light text-foreground mb-12 animate-slide-up-scale" style={{ animationDelay: '0.3s' }}>Join us as we exchange our vows</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-12 max-w-3xl mx-auto">
                <div className="text-center animate-slide-up-delayed-3">
                  <Calendar className="w-8 h-8 text-primary/40 mx-auto mb-4" />
                  <div className="text-sm tracking-wider uppercase text-foreground/60 mb-3 font-light">Date</div>
                  <div className="text-lg font-light text-foreground">October 3, 2026</div>
                </div>
                
                <div className="text-center animate-slide-up-delayed-4">
                  <Clock className="w-8 h-8 text-primary/40 mx-auto mb-4" />
                  <div className="text-sm tracking-wider uppercase text-foreground/60 mb-3 font-light">Time</div>
                  <div className="text-lg font-light text-foreground">4:30 PM</div>
                  <div className="text-sm text-foreground/70 mt-2 font-light">Arrive by 4:15 PM</div>
                </div>
                
                <div className="text-center animate-slide-up-delayed-5">
                  <MapPin className="w-8 h-8 text-primary/40 mx-auto mb-4" />
                  <div className="text-sm tracking-wider uppercase text-foreground/60 mb-3 font-light">Location</div>
                  <div className="text-lg font-light text-foreground">
                    Longwood Gardens<br />
                    Open Air Theatre
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px w-24 bg-gradient-to-r from-transparent via-secondary/30 to-transparent mx-auto my-24 animate-elegant-fade-in" style={{ animationDelay: '0.8s' }} />

            {/* Reception */}
            <div className="mb-32">
              <div className="text-center mb-16">
                <div className="text-sm tracking-[0.3em] uppercase text-secondary/60 mb-6 font-light animate-slide-up-delayed-6">Reception</div>
                <h2 className="text-3xl md:text-4xl font-light text-foreground mb-12 animate-slide-up-scale" style={{ animationDelay: '1.1s' }}>Dinner, drinks, and dancing to follow</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-12 max-w-3xl mx-auto">
                <div className="text-center animate-slide-up-delayed" style={{ animationDelay: '1.2s' }}>
                  <Calendar className="w-8 h-8 text-secondary/40 mx-auto mb-4" />
                  <div className="text-sm tracking-wider uppercase text-foreground/60 mb-3 font-light">Date</div>
                  <div className="text-lg font-light text-foreground">October 3, 2026</div>
                </div>
                
                <div className="text-center animate-slide-up-delayed" style={{ animationDelay: '1.3s' }}>
                  <Clock className="w-8 h-8 text-secondary/40 mx-auto mb-4" />
                  <div className="text-sm tracking-wider uppercase text-foreground/60 mb-3 font-light">Time</div>
                  <div className="text-lg font-light text-foreground">6:00 PM - 11:00 PM</div>
                  <div className="text-sm text-foreground/70 mt-2 font-light">Cocktail hour at 6:00 PM</div>
                </div>
                
                <div className="text-center animate-slide-up-delayed" style={{ animationDelay: '1.4s' }}>
                  <MapPin className="w-8 h-8 text-secondary/40 mx-auto mb-4" />
                  <div className="text-sm tracking-wider uppercase text-foreground/60 mb-3 font-light">Location</div>
                  <div className="text-lg font-light text-foreground">
                    Longwood Gardens<br />
                    Terrace Restaurant
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto my-24 animate-elegant-fade-in" style={{ animationDelay: '1.5s' }} />

            {/* Additional Information */}
            <div className="grid md:grid-cols-3 gap-16 max-w-4xl mx-auto">
              <div className="text-center animate-slide-up-delayed" style={{ animationDelay: '1.6s' }}>
                <div className="text-sm tracking-[0.3em] uppercase text-foreground/60 mb-6 font-light">Dress Code</div>
                <h3 className="text-xl font-light text-foreground mb-4">Formal Garden Attire</h3>
                <p className="text-sm font-light text-foreground/80 leading-relaxed">
                  Please wear formal attire in garden-appropriate colors. Ladies may prefer block heels or wedges for the outdoor ceremony.
                </p>
              </div>
              
              <div className="text-center animate-slide-up-delayed" style={{ animationDelay: '1.7s' }}>
                <div className="text-sm tracking-[0.3em] uppercase text-foreground/60 mb-6 font-light">Weather</div>
                <h3 className="text-xl font-light text-foreground mb-4">October in Pennsylvania</h3>
                <p className="text-sm font-light text-foreground/80 leading-relaxed">
                  Expect pleasant fall weather around 60-70°F. We recommend bringing a light jacket for the evening.
                </p>
              </div>
              
              <div className="text-center animate-slide-up-delayed" style={{ animationDelay: '1.8s' }}>
                <div className="text-sm tracking-[0.3em] uppercase text-foreground/60 mb-6 font-light">Parking</div>
                <h3 className="text-xl font-light text-foreground mb-4">Complimentary</h3>
                <p className="text-sm font-light text-foreground/80 leading-relaxed">
                  Free parking is available at Longwood Gardens. Valet service will be provided at the main entrance.
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="text-center mt-24 animate-elegant-fade-in" style={{ animationDelay: '1.9s' }}>
              <div className="text-sm font-light text-foreground/70 space-y-1">
                <p>1001 Longwood Road</p>
                <p>Kennett Square, Pennsylvania 19348</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}