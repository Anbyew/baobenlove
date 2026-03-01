import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

export function Gallery() {
  const images = [
    "/bg1.jpg",
    "/bg2.jpg",
    "/bg3.jpg",
    "/bg4.jpg",
    "/bg5.jpg",
    "/bg6.jpg",
    "/bg7.jpg",
    "/bg8.jpg",
  ];

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <img 
          src="/bg8.jpg"
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
              <h1 className="text-5xl md:text-7xl font-light mb-6 text-foreground tracking-tight animate-slide-in-left">Gallery</h1>
              <p className="text-xl font-light text-foreground/80 animate-slide-up-delayed">Moments from our journey</p>
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

        {/* Bottom Section */}
        <div className="relative py-24 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-secondary/30 to-transparent mx-auto mb-16 animate-elegant-fade-in" style={{ animationDelay: '1s' }} />
            
            <h3 className="text-2xl font-light text-foreground mb-8 animate-slide-up-scale" style={{ animationDelay: '1.1s' }}>Share Your Moments</h3>
            <p className="text-base font-light text-foreground/80 mb-6 animate-slide-up-delayed" style={{ animationDelay: '1.2s' }}>
              We'd love to see your photos from our special day
            </p>
            <p className="text-lg font-light animate-elegant-fade-in" style={{ animationDelay: '1.3s' }}>
              <span className="text-primary">#BaoKrakoffWedding2026</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}