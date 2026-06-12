import { Mountain, Sprout, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { useLang } from '../context/LanguageContext';

export function Registry() {
  const { t } = useLang();
  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <img 
          src="/Wedding Cherries Web/IMG_0267.jpg"
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
              <h1 className="text-5xl md:text-7xl font-light mb-6 text-foreground tracking-tight animate-slide-in-left">{t.registryTitle}</h1>
            </div>
          </div>
        </div>

        {/* Content Panel with White Background */}
        <div className="max-w-3xl mx-auto px-4 pb-32">
          <div className="bg-white/85 backdrop-blur-md shadow-2xl shadow-black/5 p-8 md:p-16 rounded-sm">
            {/* Introduction */}
            <div className="text-center mb-24 animate-slide-up-delayed-2">
              <p className="text-base font-light text-foreground/80 leading-relaxed">
                {t.registryIntro}
              </p>
            </div>

            {/* Fund Pages */}
            <div className="grid sm:grid-cols-2 gap-6 mb-12">
              <Link
                to="/moonboard"
                className="group block border border-foreground/10 rounded-sm p-8 text-center hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 animate-slide-up-delayed-3"
              >
                <Mountain className="w-10 h-10 text-primary/50 mx-auto mb-5 group-hover:text-primary transition-colors" />
                <h3 className="text-xl font-light text-foreground mb-2">Climbing Board Fund</h3>
                <p className="text-sm font-light text-foreground/60 leading-relaxed mb-5">
                  Fund a hold on our future climbing wall — pick a shape, color, and spot, and leave us a note.
                </p>
                <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-primary/70 group-hover:text-primary font-light">
                  Visit the Moonboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link
                to="/garden"
                className="group block border border-foreground/10 rounded-sm p-8 text-center hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 animate-slide-up-delayed-4"
              >
                <Sprout className="w-10 h-10 text-primary/50 mx-auto mb-5 group-hover:text-primary transition-colors" />
                <h3 className="text-xl font-light text-foreground mb-2">Grow Our Garden</h3>
                <p className="text-sm font-light text-foreground/60 leading-relaxed mb-5">
                  Plant grass, flowers, shrubs, and trees in your own little garden for our first home.
                </p>
                <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-primary/70 group-hover:text-primary font-light">
                  Visit the Garden
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>

            {/* Footer Note */}
            <div className="text-center mt-32 animate-elegant-fade-in" style={{ animationDelay: '1.4s' }}>
              <p className="text-sm font-light text-foreground/70">
                {t.registryContact}{' '}
                <a 
                  href="mailto:bellabenbao@gmail.com"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  bellabenbao@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}