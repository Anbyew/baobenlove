import { useState } from 'react';
import { Mountain, Sprout, Car, PawPrint, ArrowRight, Flag } from 'lucide-react';
import { Link } from 'react-router';
import { useLang } from '../context/LanguageContext';
import { useGuestIdentity } from '../context/GuestIdentityContext';
import { trackClick } from '../lib/auth';

const WWF_DONATE_URL = 'https://gifts.worldwildlife.org/gift-center/one-time-donation';
const WWF_AMOUNTS = [25, 50, 100, 250];

export function Registry() {
  const { t } = useLang();
  const { identity } = useGuestIdentity();
  const [wwfAmount, setWwfAmount] = useState<number | null>(null);

  const handleWwfDonate = (amount: number | null) => {
    trackClick({
      sessionToken: identity?.sessionToken,
      label: 'registry_wwf_donate',
      metadata: { amount },
    });
    window.open(WWF_DONATE_URL, '_blank', 'noopener,noreferrer');
  };
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
            <div className="text-center mb-12 animate-slide-up-delayed-2">
              <p className="text-base font-light text-foreground/80 leading-relaxed">
                {t.registryIntro}
              </p>
            </div>

            {/* Charity */}
            <div className="mb-24">
              <div className="border border-foreground/10 rounded-sm p-8 text-center animate-slide-up-delayed-3">
                <PawPrint className="w-10 h-10 text-primary/50 mx-auto mb-5" />
                <h3 className="text-xl font-light text-foreground mb-2">Give to the World Wildlife Fund</h3>
                <p className="text-sm font-light text-foreground/60 leading-relaxed mb-5 max-w-md mx-auto">
                  Help protect the wild places and creatures we love.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                  {WWF_AMOUNTS.map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => { setWwfAmount(amount); handleWwfDonate(amount); }}
                      className={`w-16 h-10 rounded-full border text-sm font-light transition-all ${
                        wwfAmount === amount
                          ? 'border-primary/50 bg-primary/10 text-foreground'
                          : 'border-foreground/15 text-foreground/60 hover:border-primary/40'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleWwfDonate(null)}
                  className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-primary/70 hover:text-primary font-light"
                >
                  Donate Another Amount
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Games Introduction */}
            <div className="text-center mb-12 animate-slide-up-delayed-2">
              <p className="text-base font-light text-foreground/80 leading-relaxed">
                {t.registryGamesIntro}
              </p>
            </div>

            {/* Fund Games */}
            <div className="grid sm:grid-cols-2 gap-6 mb-12">
              <Link
                to="/moonboard"
                onClick={() => trackClick({ sessionToken: identity?.sessionToken, label: 'registry_visit_moonboard' })}
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
                onClick={() => trackClick({ sessionToken: identity?.sessionToken, label: 'registry_visit_garden' })}
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

              <Link
                to="/escape"
                onClick={() => trackClick({ sessionToken: identity?.sessionToken, label: 'registry_visit_escape' })}
                className="group block border border-foreground/10 rounded-sm p-8 text-center hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 animate-slide-up-delayed-4"
              >
                <Car className="w-10 h-10 text-primary/50 mx-auto mb-5 group-hover:text-primary transition-colors" />
                <h3 className="text-xl font-light text-foreground mb-2">Escape the Reception</h3>
                <p className="text-sm font-light text-foreground/60 leading-relaxed mb-5">
                  Help us clear the road to our honeymoon — fund the removal of comedic obstacles, one by one.
                </p>
                <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-primary/70 group-hover:text-primary font-light">
                  Clear the Road
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link
                to="/climb"
                onClick={() => trackClick({ sessionToken: identity?.sessionToken, label: 'registry_visit_climb' })}
                className="group block border border-foreground/10 rounded-sm p-8 text-center hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 animate-slide-up-delayed-4"
              >
                <Flag className="w-10 h-10 text-primary/50 mx-auto mb-5 group-hover:text-primary transition-colors" />
                <h3 className="text-xl font-light text-foreground mb-2">Drag Ben Up the Mountain</h3>
                <p className="text-sm font-light text-foreground/60 leading-relaxed mb-5">
                  Fund a boost to push Ben up the slope toward the summit — and our honeymoon.
                </p>
                <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-primary/70 group-hover:text-primary font-light">
                  Send a Boost
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