import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { useGuestSession } from '../context/GuestSessionContext';
import { saveInviteRsvp, type AttendanceStatus } from '../lib/invite';

type FormField = 'attendance' | 'guestCount' | 'dietaryRestrictions' | 'songRequest';

export function RSVPPage() {
  const { invite, token, isLoading, error, identifyGuest, refreshInvite } = useGuestSession();
  const contactEmail = import.meta.env.VITE_RSVP_CONTACT_EMAIL?.trim() || 'wedding@baokrakoff.com';
  const [formData, setFormData] = useState({
    attendance: '' as AttendanceStatus,
    guestCount: '1',
    dietaryRestrictions: '',
    songRequest: '',
  });
  const [lookupData, setLookupData] = useState({
    name: '',
    email: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!invite) return;

    setFormData({
      attendance: invite.rsvp.attendance,
      guestCount: String(invite.rsvp.guestCount ?? invite.maxGuests ?? 1),
      dietaryRestrictions: invite.rsvp.dietaryRestrictions,
      songRequest: invite.rsvp.songRequest,
    });
    setSubmitted(false);
    setSubmitError(null);
  }, [invite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setSubmitError('Please open your invitation link or look up your household first.');
      return;
    }

    if (formData.attendance !== 'yes' && formData.attendance !== 'no') {
      setSubmitError('Please let us know whether you will be attending.');
      return;
    }

    const guestCount = Math.max(1, Number.parseInt(formData.guestCount, 10) || 1);

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await saveInviteRsvp(token, {
        attendance: formData.attendance,
        guestCount,
        dietaryRestrictions: formData.dietaryRestrictions,
        songRequest: formData.songRequest,
      });
      await refreshInvite();
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'We could not save your RSVP. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: FormField, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);

    try {
      await identifyGuest(lookupData);
    } catch (err) {
      setLookupError(
        err instanceof Error
          ? err.message
          : 'We could not find your invitation with that information.',
      );
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <img 
          src="/backgrounds/bg7.jpg"
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

            {submitted && invite ? (
              <div className="text-center py-16 animate-elegant-fade-in">
                <div className="h-px w-12 bg-primary/30 mx-auto mb-12" />
                <h3 className="text-3xl font-light text-foreground mb-6">Thank you</h3>
                <p className="text-base font-light text-foreground/80">
                  Your RSVP for {invite.partyName} has been received. We can't wait to celebrate with you.
                </p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-16 animate-elegant-fade-in">
                <div className="h-px w-12 bg-primary/30 mx-auto mb-12" />
                <h3 className="text-2xl font-light text-foreground mb-4">Opening your invitation</h3>
                <p className="text-base font-light text-foreground/80">
                  Please wait a moment while we load your household details.
                </p>
              </div>
            ) : !invite ? (
              <div className="animate-slide-up-delayed-3">
                <div className="text-center mb-10">
                  <h3 className="text-3xl font-light text-foreground mb-4">Find your invitation</h3>
                  <p className="text-base font-light text-foreground/80 max-w-xl mx-auto">
                    If you opened the site without your household link, enter the name and email from your invitation and we will open your RSVP.
                  </p>
                </div>

                <form onSubmit={handleLookupSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="lookup-name" className="text-sm tracking-wider uppercase font-light text-foreground/80">
                      Name on invitation
                    </Label>
                    <Input
                      id="lookup-name"
                      required
                      value={lookupData.name}
                      onChange={(e) => setLookupData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="border-foreground/10 focus:border-primary bg-transparent py-6 font-light"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="lookup-email" className="text-sm tracking-wider uppercase font-light text-foreground/80">
                      Invitation email
                    </Label>
                    <Input
                      id="lookup-email"
                      type="email"
                      required
                      value={lookupData.email}
                      onChange={(e) => setLookupData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="name@example.com"
                      className="border-foreground/10 focus:border-primary bg-transparent py-6 font-light"
                    />
                  </div>

                  {(lookupError || error) && (
                    <p className="text-sm text-destructive font-light">
                      {lookupError ?? error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-sm tracking-widest uppercase font-light transition-all duration-300"
                  >
                    Open RSVP
                  </Button>
                </form>

                <p className="mt-8 text-center text-sm font-light text-foreground/70">
                  If you still have trouble, email{' '}
                  <a href={`mailto:${contactEmail}`} className="text-primary hover:text-primary/80 transition-colors">
                    {contactEmail}
                  </a>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 animate-slide-up-delayed-3">
                <div className="space-y-5 border border-foreground/10 bg-white/40 px-5 py-6">
                  <div>
                    <p className="text-sm tracking-wider uppercase text-secondary/70 font-light">
                      Household
                    </p>
                    <h3 className="mt-2 text-2xl font-light text-foreground">{invite.partyName}</h3>
                  </div>
                  <div className="grid gap-3 text-sm font-light text-foreground/75 md:grid-cols-2">
                    <p>
                      Reserved seats: <span className="text-foreground">{invite.maxGuests}</span>
                    </p>
                    <p>
                      Guests: <span className="text-foreground">{invite.guestNames.join(', ') || invite.partyName}</span>
                    </p>
                    {invite.primaryEmail && (
                      <p className="md:col-span-2">
                        Invitation email: <span className="text-foreground">{invite.primaryEmail}</span>
                      </p>
                    )}
                    {invite.rsvp.submittedAt && (
                      <p className="md:col-span-2 text-foreground/60">
                        Last updated {new Date(invite.rsvp.submittedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Attendance */}
                <div className="space-y-4">
                  <Label className="text-sm tracking-wider uppercase font-light text-foreground/80">
                    Will you be attending? *
                  </Label>
                  <RadioGroup
                    value={formData.attendance}
                    onValueChange={(value) => handleChange('attendance', value)}
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
                        max={String(invite.maxGuests)}
                        value={formData.guestCount}
                        onChange={(e) => handleChange('guestCount', e.target.value)}
                        className="border-foreground/10 focus:border-primary bg-transparent py-6 font-light"
                      />
                      <p className="text-xs font-light text-foreground/70">Including yourself, up to {invite.maxGuests} reserved seat{invite.maxGuests === 1 ? '' : 's'}.</p>
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

                {submitError && (
                  <p className="text-sm text-destructive font-light">{submitError}</p>
                )}

                {/* Submit Button */}
                <div className="pt-8">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-sm tracking-widest uppercase font-light transition-all duration-300"
                  >
                    {isSubmitting ? 'Saving RSVP...' : invite.rsvp.submittedAt ? 'Update RSVP' : 'Submit RSVP'}
                  </Button>
                </div>
              </form>
            )}

            {/* Contact Info */}
            <div className="mt-16 text-center">
              <p className="text-sm font-light text-foreground/70">
                Questions?{' '}
                <a href={`mailto:${contactEmail}`} className="text-primary hover:text-primary/80 transition-colors">
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
