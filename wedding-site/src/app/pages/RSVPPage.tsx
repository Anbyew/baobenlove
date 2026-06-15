import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { useGuestSession } from '../context/GuestSessionContext';
import { useGuestIdentity } from '../context/GuestIdentityContext';
import { saveInviteRsvp, type AttendanceStatus } from '../lib/invite';
import { trackClick } from '../lib/auth';
import { useLang } from '../context/LanguageContext';

type FormField = 'attendance' | 'guestCount' | 'dietaryRestrictions' | 'songRequest';

export function RSVPPage() {
  const { invite, token, isLoading, error, identifyGuest, refreshInvite } = useGuestSession();
  const { identity } = useGuestIdentity();
  const { t, lang } = useLang();
  const contactEmail = import.meta.env.VITE_RSVP_CONTACT_EMAIL?.trim() || 'bellabenbao@gmail.com';

  const [formData, setFormData] = useState({
    attendance: '' as AttendanceStatus,
    guestCount: '1',
    dietaryRestrictions: '',
    songRequest: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const autoLookupAttempted = useRef(false);

  useEffect(() => {
    if (identity && !invite && !isLoading && !autoLookupAttempted.current) {
      autoLookupAttempted.current = true;
      identifyGuest({ email: identity.email, name: identity.name }).catch(() => {});
    }
  }, [identity, invite, isLoading, identifyGuest]);

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
    if (!token) return;
    if (formData.attendance !== 'yes' && formData.attendance !== 'no') {
      setSubmitError(t.rsvpAttendError);
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
      trackClick({
        sessionToken: identity?.sessionToken,
        label: 'rsvp_submit',
        metadata: { attendance: formData.attendance, guestCount },
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t.rsvpSaveError,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: FormField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0">
        <img src="/Wedding Cherries Web/IMG_0400.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/40" />
      </div>

      <div className="relative z-10">
        <div className="relative py-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-sm" />
            <div className="relative">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-12 animate-elegant-fade-in" />
              <h1 className="text-5xl md:text-7xl font-light mb-6 text-foreground tracking-tight animate-slide-in-left">
                RSVP
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-32">
          <div className="bg-white/85 backdrop-blur-md shadow-2xl shadow-black/5 p-8 md:p-16 rounded-sm">
            <div className="text-center mb-16 animate-slide-up-delayed-2">
              <p className="text-sm tracking-wider uppercase text-secondary/70 font-light">
                {t.rsvpDeadline}
              </p>
            </div>

            {submitted && invite ? (
              <div className="text-center py-16 animate-elegant-fade-in">
                <div className="h-px w-12 bg-primary/30 mx-auto mb-12" />
                <h3 className="text-3xl font-light text-foreground mb-6">{t.rsvpThankYou}</h3>
                <p className="text-base font-light text-foreground/80">
                  {lang === 'zh'
                    ? <>{t.rsvpReceivedPre} {invite.partyName} {t.rsvpReceivedPost}</>
                    : <>{t.rsvpReceivedPre} {invite.partyName} {t.rsvpReceivedPost}</>}
                </p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-16 animate-elegant-fade-in">
                <div className="h-px w-12 bg-primary/30 mx-auto mb-12" />
                <h3 className="text-2xl font-light text-foreground mb-4">{t.rsvpLoading}</h3>
                <p className="text-base font-light text-foreground/80">
                  {t.rsvpLoadingMsg}
                </p>
              </div>
            ) : !invite ? (
              <div className="text-center py-16 animate-elegant-fade-in">
                <div className="h-px w-12 bg-primary/30 mx-auto mb-12" />
                <h3 className="text-2xl font-light text-foreground mb-4">
                  {t.rsvpNotFound}
                </h3>
                <p className="text-base font-light text-foreground/80 mb-8">
                  {error ? error : t.rsvpNotFoundMsg}
                </p>
                <p className="text-sm font-light text-foreground/70">
                  {t.rsvpContactPre}{' '}
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    {contactEmail}
                  </a>{' '}
                  {t.rsvpContactPost}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 animate-slide-up-delayed-3">
                <div className="space-y-5 border border-foreground/10 bg-white/40 px-5 py-6">
                  <div>
                    <p className="text-sm tracking-wider uppercase text-secondary/70 font-light">
                      {t.rsvpHousehold}
                    </p>
                    <h3 className="mt-2 text-2xl font-light text-foreground">{invite.partyName}</h3>
                  </div>
                  <div className="grid gap-3 text-sm font-light text-foreground/75 md:grid-cols-2">
                    <p>
                      {t.rsvpReservedSeats}: <span className="text-foreground">{invite.maxGuests}</span>
                    </p>
                    <p>
                      {t.rsvpGuests}:{' '}
                      <span className="text-foreground">
                        {invite.guestNames.join(', ') || invite.partyName}
                      </span>
                    </p>
                    {invite.primaryEmail && (
                      <p className="md:col-span-2">
                        {t.rsvpInvitationEmail}:{' '}
                        <span className="text-foreground">{invite.primaryEmail}</span>
                      </p>
                    )}
                    {invite.rsvp.submittedAt && (
                      <p className="md:col-span-2 text-foreground/60">
                        {t.rsvpLastUpdated} {new Date(invite.rsvp.submittedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm tracking-wider uppercase font-light text-foreground/80">
                    {t.rsvpAttending}
                  </Label>
                  <RadioGroup
                    value={formData.attendance}
                    onValueChange={(value) => handleChange('attendance', value)}
                  >
                    <div className="flex items-center space-x-3 p-5 border border-foreground/10 hover:border-primary/30 transition-colors">
                      <RadioGroupItem value="yes" id="yes" />
                      <Label htmlFor="yes" className="font-light flex-1 cursor-pointer">
                        {t.rsvpAccepts}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-5 border border-foreground/10 hover:border-primary/30 transition-colors">
                      <RadioGroupItem value="no" id="no" />
                      <Label htmlFor="no" className="font-light flex-1 cursor-pointer">
                        {t.rsvpDeclines}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.attendance === 'yes' && (
                  <>
                    <div className="space-y-3">
                      <Label
                        htmlFor="guestCount"
                        className="text-sm tracking-wider uppercase font-light text-foreground/80"
                      >
                        {t.rsvpGuestCount}
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
                      <p className="text-xs font-light text-foreground/70">
                        {t.rsvpSeatHintPre} {invite.maxGuests}{' '}
                        {lang === 'zh'
                          ? t.rsvpSeatHintPost
                          : invite.maxGuests === 1 ? t.rsvpSeatHintPost : t.rsvpSeatHintPostPlural}.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="dietary"
                        className="text-sm tracking-wider uppercase font-light text-foreground/80"
                      >
                        {t.rsvpDietary}
                      </Label>
                      <Textarea
                        id="dietary"
                        value={formData.dietaryRestrictions}
                        onChange={(e) => handleChange('dietaryRestrictions', e.target.value)}
                        placeholder={t.rsvpDietaryPlaceholder}
                        rows={4}
                        className="border-foreground/10 focus:border-primary bg-transparent font-light resize-none"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="songRequest"
                        className="text-sm tracking-wider uppercase font-light text-foreground/80"
                      >
                        {t.rsvpSongRequest}
                      </Label>
                      <Input
                        id="songRequest"
                        value={formData.songRequest}
                        onChange={(e) => handleChange('songRequest', e.target.value)}
                        placeholder={t.rsvpSongPlaceholder}
                        className="border-foreground/10 focus:border-primary bg-transparent py-6 font-light"
                      />
                    </div>
                  </>
                )}

                {submitError && (
                  <p className="text-sm text-destructive font-light">{submitError}</p>
                )}

                <div className="pt-8">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-sm tracking-widest uppercase font-light transition-all duration-300"
                  >
                    {isSubmitting
                      ? t.rsvpSaving
                      : invite.rsvp.submittedAt
                        ? t.rsvpUpdate
                        : t.rsvpSubmit}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-16 text-center">
              <p className="text-sm font-light text-foreground/70">
                {t.rsvpQuestions}{' '}
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  {t.rsvpEmailUs}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
