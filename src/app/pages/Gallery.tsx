import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { useLang } from '../context/LanguageContext';

export function Gallery() {
  const { t } = useLang();
  const images = Array.from({ length: 36 }, (_, i) => `/gallery/img_${i + 1}.jpg`);

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <img 
          src="/bg6.jpg"
          alt="Garden background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/40" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-sm" />
            <div className="relative">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-12 animate-elegant-fade-in" />
              <h1 className="text-5xl md:text-7xl font-light mb-6 text-foreground tracking-tight animate-slide-in-left">{t.galleryTitle}</h1>
              <p className="text-xl font-light text-foreground/80 animate-slide-up-delayed">{t.gallerySubtitle}</p>
            </div>
          </div>
        </div>

        {/* Seamless Grid Gallery - No Gaps */}
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {images.map((src, index) => (
              <div
                key={index}
                className="relative overflow-hidden group aspect-square animate-slide-up-delayed"
                style={{ 
                  animationDelay: `${0.1 + index * 0.05}s`,
                  animationFillMode: 'both'
                }}
              >
                <img
                  src={src}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}