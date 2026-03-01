export function Schedule() {
  const events = [
    {
      time: '4:00 PM',
      title: 'Guest Arrival',
      description: 'Please arrive early and find your seats in the Open Air Theatre',
    },
    {
      time: '4:30 PM',
      title: 'Ceremony Begins',
      description: 'Join us in the garden as we exchange our vows under the autumn sky',
    },
    {
      time: '5:15 PM',
      title: 'Garden Stroll & Photos',
      description: 'Explore the beautiful Longwood Gardens while we take wedding photos',
    },
    {
      time: '6:00 PM',
      title: 'Cocktail Hour',
      description: 'Enjoy signature cocktails and hors d\'oeuvres on the Terrace',
    },
    {
      time: '7:00 PM',
      title: 'Reception & Dinner',
      description: 'A seated dinner featuring seasonal, locally-sourced cuisine',
    },
    {
      time: '8:30 PM',
      title: 'First Dance & Toasts',
      description: 'Special moments with heartfelt toasts from loved ones',
    },
    {
      time: '9:00 PM',
      title: 'Cake Cutting',
      description: 'Join us for a sweet celebration with our garden-inspired wedding cake',
    },
    {
      time: '9:30 PM',
      title: 'Dancing',
      description: 'Let\'s celebrate on the dance floor all night long',
    },
    {
      time: '11:00 PM',
      title: 'Sparkler Send-Off',
      description: 'A magical farewell under the stars with sparklers',
    },
  ];

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
        <div className="relative py-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-sm" />
            <div className="relative">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-12 animate-elegant-fade-in" />
              <h1 className="text-5xl md:text-7xl font-light mb-6 text-foreground tracking-tight animate-slide-in-left">Schedule</h1>
              <p className="text-xl font-light text-foreground/80 animate-slide-up-delayed">Timeline for our special day</p>
            </div>
          </div>
        </div>

        {/* Content Panel with White Background */}
        <div className="max-w-3xl mx-auto px-4 pb-32">
          <div className="bg-white/85 backdrop-blur-md shadow-2xl shadow-black/5 p-8 md:p-16 rounded-sm">
            <div className="space-y-12">
              {events.map((event, index) => (
                <div
                  key={index}
                  className="relative grid grid-cols-[120px,auto,1fr] md:grid-cols-[140px,auto,1fr] gap-6 md:gap-8 items-start group animate-slide-up-delayed"
                  style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                >
                  {/* Time */}
                  <div className="text-right pt-1">
                    <div className="text-base tracking-wider font-light text-primary">{event.time}</div>
                  </div>

                  {/* Dot and Line */}
                  <div className="relative flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-primary/60 border-2 border-white mt-1.5 transition-all duration-300 group-hover:bg-primary group-hover:scale-125 shadow-md" />
                    {index < events.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-primary/50 to-primary/20 mt-2 shadow-sm" style={{ minHeight: '3rem' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pt-0.5">
                    <h3 className="text-xl md:text-2xl font-light text-foreground mb-2 tracking-tight">{event.title}</h3>
                    <p className="text-base font-light text-foreground/80 leading-relaxed">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Note */}
            <div className="mt-24 text-center animate-elegant-fade-in" style={{ animationDelay: '1.5s' }}>
              <p className="text-sm font-light text-foreground/70 italic">
                Times are approximate and may vary slightly throughout the evening
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}