import { Plane, Hotel, Car, Phone, MapPin } from 'lucide-react';

export function Travel() {
  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <img 
          src="/bg4.jpg"
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
              <h1 className="text-5xl md:text-7xl font-light mb-6 text-foreground tracking-tight animate-slide-in-left">Travel</h1>
              <p className="text-xl font-light text-foreground/80 animate-slide-up-delayed">Plan your visit</p>
            </div>
          </div>
        </div>

        {/* Content Panel with White Background */}
        <div className="max-w-5xl mx-auto px-4 pb-32">
          <div className="bg-white/85 backdrop-blur-md shadow-2xl shadow-black/5 p-8 md:p-16 rounded-sm">
            {/* Main Travel Info */}
            <div className="grid md:grid-cols-3 gap-16 mb-32">
              {/* Airport */}
              <div className="text-center animate-slide-up-delayed-2">
                <Plane className="w-8 h-8 text-primary/40 mx-auto mb-6" />
                <div className="text-sm tracking-[0.3em] uppercase text-foreground/60 mb-6 font-light">Getting Here</div>
                <div className="space-y-6">
                  <div>
                    <p className="font-light text-foreground mb-2">Philadelphia Airport (PHL)</p>
                    <p className="text-sm text-foreground/70 font-light">40 minutes from venue</p>
                  </div>
                  <div>
                    <p className="font-light text-foreground mb-2">Baltimore/Washington (BWI)</p>
                    <p className="text-sm text-foreground/70 font-light">75 minutes from venue</p>
                  </div>
                </div>
              </div>

              {/* Hotels */}
              <div className="text-center animate-slide-up-delayed-3">
                <Hotel className="w-8 h-8 text-secondary/40 mx-auto mb-6" />
                <div className="text-sm tracking-[0.3em] uppercase text-foreground/60 mb-6 font-light">Where to Stay</div>
                <p className="text-sm font-light text-foreground/80 leading-relaxed">
                  We have reserved room blocks at several nearby hotels
                </p>
              </div>

              {/* Transportation */}
              <div className="text-center animate-slide-up-delayed-4">
                <Car className="w-8 h-8 text-primary/40 mx-auto mb-6" />
                <div className="text-sm tracking-[0.3em] uppercase text-foreground/60 mb-6 font-light">Transportation</div>
                <div className="space-y-4">
                  <p className="text-sm font-light text-foreground/80">Complimentary shuttles available</p>
                  <p className="text-sm font-light text-foreground/80">Free parking & valet service</p>
                </div>
              </div>
            </div>

            <div className="h-px w-24 bg-gradient-to-r from-transparent via-secondary/30 to-transparent mx-auto my-24 animate-elegant-fade-in" style={{ animationDelay: '0.6s' }} />

            {/* Hotel Recommendations */}
            <div>
              <div className="text-center mb-16 animate-slide-up-scale" style={{ animationDelay: '0.7s' }}>
                <h2 className="text-3xl font-light text-foreground mb-4">Recommended Hotels</h2>
              </div>

              <div className="space-y-12 max-w-3xl mx-auto">
                <div className="border-b border-foreground/5 pb-12 animate-slide-up-delayed" style={{ animationDelay: '0.8s' }}>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-light text-foreground">The Inn at Mendenhall</h3>
                    <div className="flex items-center text-sm text-foreground/70 font-light">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>3 miles</span>
                    </div>
                  </div>
                  <p className="text-sm font-light text-foreground/80 mb-4 leading-relaxed">
                    A charming boutique inn with beautiful gardens and cozy rooms
                  </p>
                  <div className="flex items-center text-sm font-light text-foreground/70">
                    <Phone className="w-3 h-3 mr-2" />
                    <span>(610) 388-1181</span>
                  </div>
                  <p className="text-xs font-light text-secondary/70 mt-3">Use code BAOKRAKOFF</p>
                </div>

                <div className="border-b border-foreground/5 pb-12 animate-slide-up-delayed" style={{ animationDelay: '0.9s' }}>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-light text-foreground">Fairville Inn Bed & Breakfast</h3>
                    <div className="flex items-center text-sm text-foreground/70 font-light">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>5 miles</span>
                    </div>
                  </div>
                  <p className="text-sm font-light text-foreground/80 mb-4 leading-relaxed">
                    Historic B&B featuring elegant rooms and gourmet breakfast
                  </p>
                  <div className="flex items-center text-sm font-light text-foreground/70">
                    <Phone className="w-3 h-3 mr-2" />
                    <span>(610) 388-5900</span>
                  </div>
                  <p className="text-xs font-light text-primary/70 mt-3">Mention wedding for special rate</p>
                </div>

                <div className="border-b border-foreground/5 pb-12 animate-slide-up-delayed" style={{ animationDelay: '1s' }}>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-light text-foreground">Hotel Du Pont</h3>
                    <div className="flex items-center text-sm text-foreground/70 font-light">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>8 miles</span>
                    </div>
                  </div>
                  <p className="text-sm font-light text-foreground/80 mb-4 leading-relaxed">
                    Luxury hotel in Wilmington with exceptional service and dining
                  </p>
                  <div className="flex items-center text-sm font-light text-foreground/70">
                    <Phone className="w-3 h-3 mr-2" />
                    <span>(302) 594-3100</span>
                  </div>
                  <p className="text-xs font-light text-secondary/70 mt-3">Block available</p>
                </div>

                <div className="pb-12 animate-slide-up-delayed" style={{ animationDelay: '1.1s' }}>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-light text-foreground">Brandywine River Hotel</h3>
                    <div className="flex items-center text-sm text-foreground/70 font-light">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>4 miles</span>
                    </div>
                  </div>
                  <p className="text-sm font-light text-foreground/80 mb-4 leading-relaxed">
                    Modern hotel with comfortable amenities and easy access
                  </p>
                  <div className="flex items-center text-sm font-light text-foreground/70">
                    <Phone className="w-3 h-3 mr-2" />
                    <span>(610) 388-1200</span>
                  </div>
                  <p className="text-xs font-light text-primary/70 mt-3">Group discount available</p>
                </div>
              </div>
            </div>

            <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto my-24 animate-elegant-fade-in" style={{ animationDelay: '1.2s' }} />

            {/* Things to Do */}
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12 animate-slide-up-scale" style={{ animationDelay: '1.3s' }}>
                <h2 className="text-3xl font-light text-foreground mb-4">Explore the Area</h2>
                <p className="text-sm font-light text-foreground/80">Make a weekend of it</p>
              </div>

              <div className="space-y-4 animate-slide-up-delayed" style={{ animationDelay: '1.4s' }}>
                <p className="text-sm font-light text-foreground/85 leading-relaxed">
                  Longwood Gardens – Explore all the gardens have to offer
                </p>
                <p className="text-sm font-light text-foreground/85 leading-relaxed">
                  Winterthur Museum & Gardens – Art, antiques, and 60 acres of gardens
                </p>
                <p className="text-sm font-light text-foreground/85 leading-relaxed">
                  Brandywine River Museum of Art – American art in a stunning setting
                </p>
                <p className="text-sm font-light text-foreground/85 leading-relaxed">
                  Local Wineries – Several excellent wineries to visit nearby
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}