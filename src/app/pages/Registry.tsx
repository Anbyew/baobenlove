import { Gift, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';

export function Registry() {
  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <img 
          src="/bg5.jpg"
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
              <h1 className="text-5xl md:text-7xl font-light mb-6 text-foreground tracking-tight animate-slide-in-left">Registry</h1>
              <p className="text-xl font-light text-foreground/80 animate-slide-up-delayed">Your presence is the greatest gift</p>
            </div>
          </div>
        </div>

        {/* Content Panel with White Background */}
        <div className="max-w-3xl mx-auto px-4 pb-32">
          <div className="bg-white/85 backdrop-blur-md shadow-2xl shadow-black/5 p-8 md:p-16 rounded-sm">
            {/* Introduction */}
            <div className="text-center mb-24 animate-slide-up-delayed-2">
              <p className="text-base font-light text-foreground/80 leading-relaxed">
                Your presence at our wedding is the greatest gift of all. However, if you wish to honor us 
                with a gift, we've registered at the following stores.
              </p>
            </div>

            {/* Registry Links */}
            <div className="space-y-8 mb-32">
              <div className="flex items-center justify-between border-b border-foreground/5 pb-6 animate-slide-up-delayed-3">
                <div>
                  <h3 className="text-xl font-light text-foreground mb-1">Crate & Barrel</h3>
                  <p className="text-sm font-light text-foreground/70">Home & Kitchen</p>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-primary hover:text-primary/80 font-light"
                >
                  View
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="flex items-center justify-between border-b border-foreground/5 pb-6 animate-slide-up-delayed-4">
                <div>
                  <h3 className="text-xl font-light text-foreground mb-1">Williams Sonoma</h3>
                  <p className="text-sm font-light text-foreground/70">Gourmet Kitchen</p>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-primary hover:text-primary/80 font-light"
                >
                  View
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="flex items-center justify-between border-b border-foreground/5 pb-6 animate-slide-up-delayed-5">
                <div>
                  <h3 className="text-xl font-light text-foreground mb-1">Zola</h3>
                  <p className="text-sm font-light text-foreground/70">Universal Registry</p>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-primary hover:text-primary/80 font-light"
                >
                  View
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            <div className="h-px w-24 bg-gradient-to-r from-transparent via-secondary/30 to-transparent mx-auto my-24 animate-elegant-fade-in" style={{ animationDelay: '0.8s' }} />

            {/* Honeymoon Fund */}
            <div className="text-center">
              <Gift className="w-12 h-12 text-primary/30 mx-auto mb-8 animate-slide-up-scale" style={{ animationDelay: '0.9s' }} />
              <h2 className="text-3xl font-light text-foreground mb-6 animate-slide-up-delayed" style={{ animationDelay: '1s' }}>Honeymoon Fund</h2>
              <p className="text-sm font-light text-foreground/80 mb-3 animate-slide-up-delayed" style={{ animationDelay: '1.1s' }}>Japan</p>
              <p className="text-base font-light text-foreground/80 leading-relaxed mb-12 max-w-2xl mx-auto animate-slide-up-delayed" style={{ animationDelay: '1.2s' }}>
                We're planning an unforgettable honeymoon to Japan, where we'll explore ancient temples, 
                stroll through bamboo forests, and discover the beautiful gardens that inspired our wedding theme.
              </p>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white px-12 py-6 font-light tracking-wider uppercase transition-all duration-300 animate-slide-up-scale"
                style={{ animationDelay: '1.3s' }}
              >
                Contribute
              </Button>
            </div>

            {/* Footer Note */}
            <div className="text-center mt-32 animate-elegant-fade-in" style={{ animationDelay: '1.4s' }}>
              <p className="text-sm font-light text-foreground/70">
                Questions? Email us at{' '}
                <a 
                  href="mailto:wedding@baokrakoff.com" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  wedding@baokrakoff.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}