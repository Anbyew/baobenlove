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
          <div className="bg-white/85 backdrop-blur-md shadow-2xl shadow-black/5 p-8 md:p-16 rounded-sm text-center animate-elegant-fade-in">
            <div className="h-px w-12 bg-primary/30 mx-auto mb-12" />
            <h3 className="text-2xl font-light text-foreground mb-6 tracking-wide">
              {t.rsvpComingSoonTitle}
            </h3>
            <p className="text-base font-light text-foreground/70 leading-relaxed max-w-sm mx-auto mb-12">
              {t.rsvpComingSoonBody}
            </p>
            <div className="h-px w-12 bg-secondary/40 mx-auto mb-12" />
            <p className="text-sm font-light text-foreground/50">
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
  );
}
