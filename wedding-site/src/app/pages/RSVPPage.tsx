import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useGuestSession } from '../context/GuestSessionContext';
import { useGuestIdentity } from '../context/GuestIdentityContext';
import {
  saveInviteRsvp,
  type AttendanceStatus,
  type GuestEntry,
  type LanguageLevel,
  type Transportation,
} from '../lib/invite';
import { trackClick } from '../lib/auth';
import { useLang } from '../context/LanguageContext';

let guestIdCounter = 0;
function createBlankGuest(): GuestEntry {
  guestIdCounter += 1;
  return {
    id: `guest-${Date.now()}-${guestIdCounter}`,
    firstName: '',
    lastName: '',
    ageGroup: '',
    mainCourse: '',
    mainCourseOther: '',
    dietaryRestrictions: '',
    languageEnglish: 3,
    languageChinese: 0,
  };
}

function OptionCard({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      onClick={onSelect}
      className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
        selected ? 'border-primary/50 bg-primary/5' : 'border-foreground/10 hover:border-foreground/20'
      }`}
    >
      <span
        className={`h-4 w-4 rounded-full border flex-shrink-0 ${
          selected ? 'border-primary bg-primary' : 'border-foreground/30'
        }`}
      />
      <span className="font-light text-foreground text-sm">{children}</span>
    </label>
  );
}

export function RSVPPage() {
  const { invite, token, isLoading, error, identifyGuest, refreshInvite } = useGuestSession();
  const { identity } = useGuestIdentity();
  const { t } = useLang();
  const contactEmail = import.meta.env.VITE_RSVP_CONTACT_EMAIL?.trim() || 'bellabenbao@gmail.com';

  const [attendance, setAttendance] = useState<AttendanceStatus>('');
  const [guests, setGuests] = useState<GuestEntry[]>([]);
  const [expandedGuestIndex, setExpandedGuestIndex] = useState<number | null>(null);
  const [transportation, setTransportation] = useState<Transportation>('');
  const [songRequest, setSongRequest] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [welcomeDinnerAttendance, setWelcomeDinnerAttendance] = useState<AttendanceStatus>('');

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
    setAttendance(invite.rsvp.attendance);
    setTransportation(invite.rsvp.transportation);
    setSongRequest(invite.rsvp.songRequest);
    setAdditionalNotes(invite.rsvp.additionalNotes);
    setWelcomeDinnerAttendance(invite.rsvp.welcomeDinnerAttendance);
    const initialGuests =
      invite.rsvp.guests.length > 0
        ? invite.rsvp.guests
        : invite.rsvp.attendance === 'yes'
          ? [createBlankGuest()]
          : [];
    setGuests(initialGuests);
    setExpandedGuestIndex(initialGuests.length > 0 ? 0 : null);
    setSubmitted(false);
    setSubmitError(null);
  }, [invite]);

  const handleAttendanceChange = (value: AttendanceStatus) => {
    setAttendance(value);
    if (value === 'yes' && guests.length === 0) {
      setGuests([createBlankGuest()]);
      setExpandedGuestIndex(0);
    }
  };

  const addGuest = () => {
    if (!invite || guests.length >= invite.maxGuests) return;
    setGuests((prev) => [...prev, createBlankGuest()]);
    setExpandedGuestIndex(guests.length);
  };

  const removeGuest = (index: number) => {
    if (guests.length <= 1) return;
    setGuests((prev) => prev.filter((_, i) => i !== index));
    setExpandedGuestIndex(0);
  };

  const updateGuestField = <K extends keyof GuestEntry>(index: number, field: K, value: GuestEntry[K]) => {
    setGuests((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  };

  const guestsAreValid = () =>
    guests.every(
      (g) =>
        g.firstName.trim() &&
        g.lastName.trim() &&
        g.ageGroup &&
        g.mainCourse &&
        (g.mainCourse !== 'other' || g.mainCourseOther.trim()),
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (attendance !== 'yes' && attendance !== 'no') {
      setSubmitError(t.rsvpAttendError);
      return;
    }
    if (attendance === 'yes' && (guests.length === 0 || !guestsAreValid())) {
      setSubmitError(t.rsvpGuestFieldError);
      return;
    }
    if (invite?.rehearsalDinner && attendance === 'yes' && welcomeDinnerAttendance !== 'yes' && welcomeDinnerAttendance !== 'no') {
      setSubmitError(t.rsvpWelcomeDinnerError);
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await saveInviteRsvp(token, {
        attendance,
        guests: attendance === 'yes' ? guests : [],
        transportation: attendance === 'yes' ? transportation : '',
        songRequest: attendance === 'yes' ? songRequest : '',
        additionalNotes: attendance === 'yes' ? additionalNotes : '',
        welcomeDinnerAttendance: invite?.rehearsalDinner && attendance === 'yes' ? welcomeDinnerAttendance : '',
      });
      await refreshInvite();
      setSubmitted(true);
      trackClick({
        sessionToken: identity?.sessionToken,
        label: 'rsvp_submit',
        metadata: { attendance, guestCount: guests.length },
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t.rsvpSaveError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const languageLevelLabels: [string, string, string, string] = [
    t.rsvpLanguageNotAtAll,
    t.rsvpLanguageSome,
    t.rsvpLanguageGood,
    t.rsvpLanguageNative,
  ];

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
                  {t.rsvpReceivedPre} {invite.partyName} {t.rsvpReceivedPost}
                </p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-16 animate-elegant-fade-in">
                <div className="h-px w-12 bg-primary/30 mx-auto mb-12" />
                <h3 className="text-2xl font-light text-foreground mb-4">{t.rsvpLoading}</h3>
                <p className="text-base font-light text-foreground/80">{t.rsvpLoadingMsg}</p>
              </div>
            ) : !invite ? (
              <div className="text-center py-16 animate-elegant-fade-in">
                <div className="h-px w-12 bg-primary/30 mx-auto mb-12" />
                <h3 className="text-2xl font-light text-foreground mb-4">{t.rsvpNotFound}</h3>
                <p className="text-base font-light text-foreground/80 mb-8">
                  {error ? error : t.rsvpNotFoundMsg}
                </p>
                <p className="text-sm font-light text-foreground/70">
                  {t.rsvpContactPre}{' '}
                  <a
                    href={`mailto:${contactEmail}`}
                    onClick={() => trackClick({ sessionToken: identity?.sessionToken, label: 'rsvp_not_found_email_click' })}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    {contactEmail}
                  </a>{' '}
                  {t.rsvpContactPost}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10 animate-slide-up-delayed-3">
                <div className="space-y-5 border border-foreground/10 bg-white/40 px-5 py-6">
                  <div>
                    <p className="text-sm tracking-wider uppercase text-secondary/70 font-light">
                      {t.rsvpHousehold}
                    </p>
                    <h3 className="mt-2 text-2xl font-light text-foreground">{invite.partyName}</h3>
                  </div>
                  <div className="space-y-2 text-sm font-light text-foreground/75">
                    <p>
                      {t.rsvpGuests}:{' '}
                      <span className="text-foreground">
                        {invite.guestNames.join(', ') || invite.partyName}
                      </span>
                    </p>
                    {invite.rsvp.submittedAt && (
                      <p className="text-foreground/60">
                        {t.rsvpLastUpdated} {new Date(invite.rsvp.submittedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <h4 className="text-xs tracking-[0.2em] uppercase text-secondary/70 font-light">
                    {t.rsvpSectionAttendance}
                  </h4>

                  <div className="space-y-4">
                    <Label className="text-sm tracking-wider uppercase font-light text-foreground/80">
                      {t.rsvpAttending}
                    </Label>
                    <div className="space-y-3">
                      <OptionCard selected={attendance === 'yes'} onSelect={() => handleAttendanceChange('yes')}>
                        {t.rsvpAccepts}
                      </OptionCard>
                      <OptionCard selected={attendance === 'no'} onSelect={() => handleAttendanceChange('no')}>
                        {t.rsvpDeclines}
                      </OptionCard>
                    </div>
                  </div>

                  {attendance === 'yes' && invite.rehearsalDinner && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm tracking-wider uppercase font-light text-foreground/80">
                          {t.rsvpWelcomeDinnerAttending}
                        </Label>
                        <p className="text-xs font-light text-foreground/50 mt-1">{t.rsvpWelcomeDinnerHint}</p>
                      </div>
                      <div className="space-y-3">
                        <OptionCard
                          selected={welcomeDinnerAttendance === 'yes'}
                          onSelect={() => setWelcomeDinnerAttendance('yes')}
                        >
                          {t.rsvpAccepts}
                        </OptionCard>
                        <OptionCard
                          selected={welcomeDinnerAttendance === 'no'}
                          onSelect={() => setWelcomeDinnerAttendance('no')}
                        >
                          {t.rsvpDeclines}
                        </OptionCard>
                      </div>
                    </div>
                  )}
                </div>

                {attendance === 'yes' && (
                  <>
                    <div className="space-y-5">
                      <h4 className="text-xs tracking-[0.2em] uppercase text-secondary/70 font-light">
                        {t.rsvpSectionGuests}
                      </h4>

                      <div className="space-y-3">
                        {guests.map((guest, index) => {
                          const isExpanded = expandedGuestIndex === index;
                          const fullName = [guest.firstName, guest.lastName].filter(Boolean).join(' ');
                          return (
                            <div key={guest.id} className="border border-foreground/10 bg-white/40">
                              <div
                                onClick={() => setExpandedGuestIndex(isExpanded ? null : index)}
                                className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none"
                              >
                                <span className="font-light text-foreground text-sm">
                                  {t.rsvpGuestTab} {index + 1}
                                  {fullName ? ` — ${fullName}` : ''}
                                </span>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  {guests.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeGuest(index);
                                      }}
                                      aria-label={t.rsvpRemoveGuest}
                                      className="h-5 w-5 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground/60 text-xs flex items-center justify-center"
                                    >
                                      ×
                                    </button>
                                  )}
                                  <ChevronDown
                                    className={`w-4 h-4 text-foreground/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  />
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="space-y-6 px-4 pb-6 pt-2 border-t border-foreground/10">
                                  <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                      <Label className="text-xs tracking-wider uppercase font-light text-foreground/60">
                                        {t.firstName} *
                                      </Label>
                                      <Input
                                        required
                                        value={guest.firstName}
                                        onChange={(e) => updateGuestField(index, 'firstName', e.target.value)}
                                        className="border-foreground/10 focus:border-primary bg-transparent py-5 font-light mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs tracking-wider uppercase font-light text-foreground/60">
                                        {t.lastName} *
                                      </Label>
                                      <Input
                                        required
                                        value={guest.lastName}
                                        onChange={(e) => updateGuestField(index, 'lastName', e.target.value)}
                                        className="border-foreground/10 focus:border-primary bg-transparent py-5 font-light mt-1"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <Label className="text-sm tracking-wider uppercase font-light text-foreground/80">
                                      {t.rsvpAgeGroup} *
                                    </Label>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      <OptionCard
                                        selected={guest.ageGroup === 'under21'}
                                        onSelect={() => updateGuestField(index, 'ageGroup', 'under21')}
                                      >
                                        {t.rsvpAgeUnder21}
                                      </OptionCard>
                                      <OptionCard
                                        selected={guest.ageGroup === 'over21'}
                                        onSelect={() => updateGuestField(index, 'ageGroup', 'over21')}
                                      >
                                        {t.rsvpAgeOver21}
                                      </OptionCard>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <Label className="text-xs tracking-wider uppercase font-light text-foreground/60">
                                      {t.rsvpMainCourse} *
                                    </Label>
                                    <select
                                      value={guest.mainCourse}
                                      onChange={(e) => updateGuestField(index, 'mainCourse', e.target.value as GuestEntry['mainCourse'])}
                                      className="w-full border border-foreground/10 focus:border-primary bg-transparent py-3 px-2 font-light text-foreground outline-none"
                                    >
                                      <option value="" disabled>{t.rsvpMainCoursePlaceholder}</option>
                                      <option value="cod">{t.rsvpMainCourseCod}</option>
                                      <option value="duck">{t.rsvpMainCourseDuck}</option>
                                      <option value="wellington">{t.rsvpMainCourseWellington}</option>
                                      <option value="childrens">{t.rsvpMainCourseChildrens}</option>
                                      <option value="other">{t.rsvpMainCourseOther}</option>
                                    </select>
                                    {guest.mainCourse === 'other' && (
                                      <Input
                                        value={guest.mainCourseOther}
                                        onChange={(e) => updateGuestField(index, 'mainCourseOther', e.target.value)}
                                        placeholder={t.rsvpMainCourseOtherPlaceholder}
                                        className="border-foreground/10 focus:border-primary bg-transparent py-5 font-light mt-2"
                                      />
                                    )}
                                  </div>

                                  <div className="space-y-3">
                                    <Label className="text-sm tracking-wider uppercase font-light text-foreground/80">
                                      {t.rsvpDietary}
                                    </Label>
                                    <Textarea
                                      value={guest.dietaryRestrictions}
                                      onChange={(e) => updateGuestField(index, 'dietaryRestrictions', e.target.value)}
                                      placeholder={t.rsvpDietaryPlaceholder}
                                      rows={3}
                                      className="border-foreground/10 focus:border-primary bg-transparent font-light resize-none"
                                    />
                                  </div>

                                  <div className="space-y-3">
                                    <Label className="text-sm tracking-wider uppercase font-light text-foreground/80">
                                      {t.rsvpLanguageProficiency}
                                    </Label>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                      <div>
                                        <Label className="text-xs tracking-wider uppercase font-light text-foreground/60">
                                          {t.rsvpLanguageEnglish}
                                        </Label>
                                        <select
                                          value={guest.languageEnglish}
                                          onChange={(e) => updateGuestField(index, 'languageEnglish', Number(e.target.value) as LanguageLevel)}
                                          className="w-full border border-foreground/10 focus:border-primary bg-transparent py-3 px-2 font-light text-foreground outline-none mt-1"
                                        >
                                          {languageLevelLabels.map((levelLabel, level) => (
                                            <option key={level} value={level}>{levelLabel}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <Label className="text-xs tracking-wider uppercase font-light text-foreground/60">
                                          {t.rsvpLanguageChinese}
                                        </Label>
                                        <select
                                          value={guest.languageChinese}
                                          onChange={(e) => updateGuestField(index, 'languageChinese', Number(e.target.value) as LanguageLevel)}
                                          className="w-full border border-foreground/10 focus:border-primary bg-transparent py-3 px-2 font-light text-foreground outline-none mt-1"
                                        >
                                          {languageLevelLabels.map((levelLabel, level) => (
                                            <option key={level} value={level}>{levelLabel}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {guests.length < invite.maxGuests && (
                        <button
                          type="button"
                          onClick={addGuest}
                          className="px-4 py-2 text-sm font-light border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-colors"
                        >
                          {t.rsvpAddGuest}
                        </button>
                      )}
                    </div>

                    <div className="space-y-5">
                      <h4 className="text-xs tracking-[0.2em] uppercase text-secondary/70 font-light">
                        {t.rsvpSectionDetails}
                      </h4>

                      <div className="space-y-3">
                        <Label className="text-sm tracking-wider uppercase font-light text-foreground/80">
                          {t.rsvpTransportation}
                        </Label>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <OptionCard selected={transportation === 'yes'} onSelect={() => setTransportation('yes')}>
                            {t.rsvpTransportationYes}
                          </OptionCard>
                          <OptionCard selected={transportation === 'no'} onSelect={() => setTransportation('no')}>
                            {t.rsvpTransportationNo}
                          </OptionCard>
                          <OptionCard selected={transportation === 'tbd'} onSelect={() => setTransportation('tbd')}>
                            {t.rsvpTransportationTbd}
                          </OptionCard>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm tracking-wider uppercase font-light text-foreground/80">
                          {t.rsvpSongRequest}
                        </Label>
                        <Input
                          value={songRequest}
                          onChange={(e) => setSongRequest(e.target.value)}
                          placeholder={t.rsvpSongPlaceholder}
                          className="border-foreground/10 focus:border-primary bg-transparent py-5 font-light"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm tracking-wider uppercase font-light text-foreground/80">
                          {t.rsvpAnythingElse}
                        </Label>
                        <Textarea
                          value={additionalNotes}
                          onChange={(e) => setAdditionalNotes(e.target.value)}
                          placeholder={t.rsvpAnythingElsePlaceholder}
                          rows={3}
                          className="border-foreground/10 focus:border-primary bg-transparent font-light resize-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {submitError && <p className="text-sm text-destructive font-light">{submitError}</p>}

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-sm tracking-widest uppercase font-light transition-all duration-300"
                  >
                    {isSubmitting ? t.rsvpSaving : invite.rsvp.submittedAt ? t.rsvpUpdate : t.rsvpSubmit}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-16 text-center">
              <p className="text-sm font-light text-foreground/70">
                {t.rsvpQuestions}{' '}
                <a
                  href={`mailto:${contactEmail}`}
                  onClick={() => trackClick({ sessionToken: identity?.sessionToken, label: 'rsvp_footer_email_click' })}
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
