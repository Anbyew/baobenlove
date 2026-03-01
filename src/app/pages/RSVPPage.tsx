import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';

export function RSVPPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    attendance: '',
    guestCount: '1',
    dietaryRestrictions: '',
    songRequest: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, this would be sent to a backend
    console.log('RSVP submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <img 
          src="/bg7.jpg"
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
              <h1 className="text-5xl md:text-7xl font-light mb-6 text-foreground tracking-tight animate-slide-in-left">RSVP</h1>
              <p className="text-xl font-light text-foreground/80 animate-slide-up-delayed">We hope you can join us</p>
            </div>
          </div>
        </div>

        {/* Content Panel with White Background */}
        <div className="max-w-2xl mx-auto px-4 pb-32">
          <div className="bg-white/85 backdrop-blur-md shadow-2xl shadow-black/5 p-8 md:p-16 rounded-sm">
            <div className="text-center mb-16 animate-slide-up-delayed-2">
              <p className="text-sm tracking-wider uppercase text-secondary/70 font-light">
                Please respond by September 1, 2026
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-16 animate-elegant-fade-in">
                <div className="h-px w-12 bg-primary/30 mx-auto mb-12" />
                <h3 className="text-3xl font-light text-foreground mb-6">Thank you</h3>
                <p className="text-base font-light text-foreground/80">
                  Your RSVP has been received. We can't wait to celebrate with you
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 animate-slide-up-delayed-3">
                {/* Name */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm tracking-wider uppercase font-light text-foreground/80">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter your name"
                    className="border-foreground/10 focus:border-primary bg-transparent py-6 font-light"
                  />
                </div>

                {/* Email */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm tracking-wider uppercase font-light text-foreground/80">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className="border-foreground/10 focus:border-primary bg-transparent py-6 font-light"
                  />
                </div>

                {/* Attendance */}
                <div className="space-y-4">
                  <Label className="text-sm tracking-wider uppercase font-light text-foreground/80">
                    Will you be attending? *
                  </Label>
                  <RadioGroup
                    value={formData.attendance}
                    onValueChange={(value) => handleChange('attendance', value)}
                    required
                  >
                    <div className="flex items-center space-x-3 p-5 border border-foreground/10 hover:border-primary/30 transition-colors">
                      <RadioGroupItem value="yes" id="yes" />
                      <Label htmlFor="yes" className="font-light flex-1 cursor-pointer">
                        Joyfully accepts
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-5 border border-foreground/10 hover:border-primary/30 transition-colors">
                      <RadioGroupItem value="no" id="no" />
                      <Label htmlFor="no" className="font-light flex-1 cursor-pointer">
                        Regretfully declines
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Conditional fields if attending */}
                {formData.attendance === 'yes' && (
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="guestCount" className="text-sm tracking-wider uppercase font-light text-foreground/80">
                        Number of Guests
                      </Label>
                      <Input
                        id="guestCount"
                        type="number"
                        min="1"
                        max="5"
                        value={formData.guestCount}
                        onChange={(e) => handleChange('guestCount', e.target.value)}
                        className="border-foreground/10 focus:border-primary bg-transparent py-6 font-light"
                      />
                      <p className="text-xs font-light text-foreground/70">Including yourself</p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="dietary" className="text-sm tracking-wider uppercase font-light text-foreground/80">
                        Dietary Restrictions
                      </Label>
                      <Textarea
                        id="dietary"
                        value={formData.dietaryRestrictions}
                        onChange={(e) => handleChange('dietaryRestrictions', e.target.value)}
                        placeholder="Please let us know of any dietary restrictions"
                        rows={4}
                        className="border-foreground/10 focus:border-primary bg-transparent font-light resize-none"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="songRequest" className="text-sm tracking-wider uppercase font-light text-foreground/80">
                        Song Request
                      </Label>
                      <Input
                        id="songRequest"
                        value={formData.songRequest}
                        onChange={(e) => handleChange('songRequest', e.target.value)}
                        placeholder="Any song you'd like to hear?"
                        className="border-foreground/10 focus:border-primary bg-transparent py-6 font-light"
                      />
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <div className="pt-8">
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-sm tracking-widest uppercase font-light transition-all duration-300"
                  >
                    Submit RSVP
                  </Button>
                </div>
              </form>
            )}

            {/* Contact Info */}
            <div className="mt-16 text-center">
              <p className="text-sm font-light text-foreground/70">
                Questions?{' '}
                <a href="mailto:wedding@baokrakoff.com" className="text-primary hover:text-primary/80 transition-colors">
                  Email us
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}