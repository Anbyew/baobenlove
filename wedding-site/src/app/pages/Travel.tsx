import { motion } from 'motion/react';
import { Plane, Hotel, Car, Phone, MapPin } from 'lucide-react';
import { Reveal } from '../components/Reveal';

const hotels = [
  {
    name: 'The Inn at Mendenhall',
    distance: '3 miles',
    description: 'A charming boutique inn with beautiful gardens and cozy rooms',
    phone: '(610) 388-1181',
    code: 'Use code BAOKRAKOFF',
    codeColor: 'text-secondary/65',
  },
  {
    name: 'Fairville Inn Bed & Breakfast',
    distance: '5 miles',
    description: 'Historic B&B featuring elegant rooms and gourmet breakfast',
    phone: '(610) 388-5900',
    code: 'Mention wedding for special rate',
    codeColor: 'text-primary/65',
  },
  {
    name: 'Hotel Du Pont',
    distance: '8 miles',
    description: 'Luxury hotel in Wilmington with exceptional service and dining',
    phone: '(302) 594-3100',
    code: 'Block available',
    codeColor: 'text-secondary/65',
  },
  {
    name: 'Brandywine River Hotel',
    distance: '4 miles',
    description: 'Modern hotel with comfortable amenities and easy access',
    phone: '(610) 388-1200',
    code: 'Group discount available',
    codeColor: 'text-primary/65',
  },
];

const attractions = [
  'Longwood Gardens – Explore all the gardens have to offer',
  'Winterthur Museum & Gardens – Art, antiques, and 60 acres of gardens',
  'Brandywine River Museum of Art – American art in a stunning setting',
  'Local Wineries – Several excellent wineries to visit nearby',
];

export function Travel() {
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0">
        <img src="/backgrounds/bg4.jpg" alt="Garden background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/25 to-white/45" />
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <div className="relative py-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-sm" />
            <div className="relative">
              <motion.div
                className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-12"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.1 }}
              />
              <div className="overflow-hidden mb-6">
                <motion.div
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h1 className="text-5xl md:text-7xl font-light text-foreground tracking-tight">Travel</h1>
                </motion.div>
              </div>
              <motion.p
                className="text-xl font-light text-foreground/70"
                initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, delay: 0.6 }}
              >
                Plan your visit
              </motion.p>
            </div>
          </div>
        </div>

        {/* Content panel */}
        <div className="max-w-5xl mx-auto px-4 pb-32">
          <div className="bg-white/80 backdrop-blur-xl shadow-2xl shadow-black/8 border border-white/50 p-8 md:p-16 rounded-sm">

            {/* Main travel info */}
            <div className="grid md:grid-cols-3 gap-16 mb-32">
              <Reveal direction="up">
                <div className="text-center">
                  <Plane className="w-7 h-7 text-primary/35 mx-auto mb-6" />
                  <div className="text-xs tracking-[0.3em] uppercase text-foreground/55 mb-6 font-light">Getting Here</div>
                  <div className="space-y-6">
                    <div>
                      <p className="font-light text-foreground mb-1.5">Philadelphia Airport (PHL)</p>
                      <p className="text-sm text-foreground/65 font-light">40 minutes from venue</p>
                    </div>
                    <div>
                      <p className="font-light text-foreground mb-1.5">Baltimore/Washington (BWI)</p>
                      <p className="text-sm text-foreground/65 font-light">75 minutes from venue</p>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal direction="up" delay={0.12}>
                <div className="text-center">
                  <Hotel className="w-7 h-7 text-secondary/35 mx-auto mb-6" />
                  <div className="text-xs tracking-[0.3em] uppercase text-foreground/55 mb-6 font-light">Where to Stay</div>
                  <p className="text-sm font-light text-foreground/75 leading-relaxed">
                    We have reserved room blocks at several nearby hotels
                  </p>
                </div>
              </Reveal>

              <Reveal direction="up" delay={0.24}>
                <div className="text-center">
                  <Car className="w-7 h-7 text-primary/35 mx-auto mb-6" />
                  <div className="text-xs tracking-[0.3em] uppercase text-foreground/55 mb-6 font-light">Transportation</div>
                  <div className="space-y-4">
                    <p className="text-sm font-light text-foreground/75">Complimentary shuttles available</p>
                    <p className="text-sm font-light text-foreground/75">Free parking & valet service</p>
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-secondary/30 to-transparent mx-auto my-24" />
            </Reveal>

            {/* Hotels */}
            <div>
              <Reveal>
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-light text-foreground mb-4">Recommended Hotels</h2>
                </div>
              </Reveal>

              <div className="space-y-10 max-w-3xl mx-auto">
                {hotels.map((hotel, i) => (
                  <Reveal key={hotel.name} delay={i * 0.1}>
                    <div className="border-b border-foreground/5 pb-10 group">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-light text-foreground transition-colors duration-300 group-hover:text-primary">{hotel.name}</h3>
                        <div className="flex items-center text-sm text-foreground/60 font-light shrink-0 ml-4">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span>{hotel.distance}</span>
                        </div>
                      </div>
                      <p className="text-sm font-light text-foreground/75 mb-3 leading-relaxed">{hotel.description}</p>
                      <div className="flex items-center text-sm font-light text-foreground/60">
                        <Phone className="w-3 h-3 mr-2" />
                        <span>{hotel.phone}</span>
                      </div>
                      <p className={`text-xs font-light mt-3 ${hotel.codeColor}`}>{hotel.code}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto my-24" />
            </Reveal>

            {/* Things to do */}
            <div className="max-w-3xl mx-auto">
              <Reveal>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-light text-foreground mb-4">Explore the Area</h2>
                  <p className="text-sm font-light text-foreground/65">Make a weekend of it</p>
                </div>
              </Reveal>
              <div className="space-y-4">
                {attractions.map((item, i) => (
                  <Reveal key={i} delay={i * 0.1}>
                    <p className="text-sm font-light text-foreground/80 leading-relaxed">{item}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
