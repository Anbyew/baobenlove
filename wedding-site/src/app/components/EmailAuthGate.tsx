import { useState } from 'react';
import { Label } from './ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { useGuestIdentity, parseName, type GuestIdentity } from '../context/GuestIdentityContext';
import { useLang } from '../context/LanguageContext';
import { sendOtp, verifyOtp, lookupByEmail, createSession, reportIssue } from '../lib/auth';

const SUPPORT_EMAIL = 'bellabenbao@gmail.com';

type Step = 'email' | 'code' | 'profile';

interface OtpState {
  token: string;
  expiresAt: number;
}

interface LookupResult {
  found: boolean;
  partyName?: string;
  guestNames?: string[];
}

const TITLES = ['', 'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];

export function EmailAuthGate({ children }: { children: React.ReactNode }) {
  const { identity, isValidating, setIdentity } = useGuestIdentity();
  const { lang, setLang, t } = useLang();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpState, setOtpState] = useState<OtpState | null>(null);
  const [verifyTicket, setVerifyTicket] = useState<{ ticket: string; ticketExpiresAt: number } | null>(null);
  const [code, setCode] = useState('');
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [customName, setCustomName] = useState({ title: '', firstName: '', lastName: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpSent, setHelpSent] = useState(false);

  if (isValidating) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
    </div>
  );
  if (identity) return <>{children}</>;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await sendOtp(email.trim().toLowerCase());
      setOtpState(result);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpState || code.length !== 6) return;
    setError(null);
    setIsLoading(true);
    try {
      const verification = await verifyOtp({ email: email.trim().toLowerCase(), code, token: otpState.token, expiresAt: otpState.expiresAt });
      setVerifyTicket({ ticket: verification.ticket, ticketExpiresAt: verification.ticketExpiresAt });
      const result = await lookupByEmail(email.trim().toLowerCase());
      setLookup(result);
      if (result.found) {
        const names = result.guestNames?.length ? result.guestNames : result.partyName ? [result.partyName] : [];
        setSelectedName(names[0] ?? '');
      }
      setStep('profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setCode('');
    setIsLoading(true);
    try {
      const result = await sendOtp(email.trim().toLowerCase());
      setOtpState(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (!verifyTicket) throw new Error('Verification expired. Please request a new code.');

      if (!lookup?.found && (!customName.title || !customName.firstName || !customName.lastName))
        throw new Error('Please fill in your title, first name, and last name.');

      const fullName = lookup?.found
        ? selectedName
        : [customName.title, customName.firstName, customName.lastName].filter(Boolean).join(' ');

      const { title, firstName, lastName } = lookup?.found
        ? parseName(fullName)
        : { title: customName.title, firstName: customName.firstName, lastName: customName.lastName };

      const session = await createSession(
        email.trim().toLowerCase(),
        fullName,
        lang,
        verifyTicket.ticket,
        verifyTicket.ticketExpiresAt,
      );
      setIdentity({
        email: email.trim().toLowerCase(),
        name: fullName,
        title,
        firstName,
        lastName,
        language: lang,
        verifiedAt: new Date().toISOString(),
        sessionToken: session.sessionToken,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save session.');
    } finally {
      setIsLoading(false);
    }
  };

  const nameOptions: string[] = lookup?.found
    ? [...(lookup.guestNames?.length ? lookup.guestNames : []), ...(lookup.partyName ? [lookup.partyName] : [])].filter(
        (n, i, arr) => arr.indexOf(n) === i,
      )
    : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4 w-full max-w-sm">
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-12" />

        <h1 className="text-3xl font-light text-foreground tracking-tight mb-2">{t.navLogo}</h1>
        <p className="text-sm font-light text-foreground/60 tracking-wider mb-12">{t.date}</p>

        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <p className="text-sm font-light text-foreground/70 mb-6">{t.emailAuthSubtitle}</p>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder={t.emailPlaceholder}
              required
              autoFocus
              className="w-full border-b border-foreground/20 focus:border-primary bg-transparent py-3 text-center font-light text-foreground placeholder:text-foreground/30 outline-none transition-colors duration-300"
            />
            {error && <p className="text-xs text-destructive font-light tracking-wide">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-sm tracking-widest uppercase font-light transition-all duration-300 mt-4 disabled:opacity-50"
            >
              {isLoading ? t.sending : t.sendCode}
            </button>
          </form>
        )}

        {/* Step 2: OTP code */}
        {step === 'code' && (
          <div className="space-y-6">
            <p className="text-sm font-light text-foreground/70">
              {t.codeSentTo}{' '}
              <span className="text-foreground">{email}</span>
            </p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode} onComplete={handleVerifyOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && <p className="text-xs text-destructive font-light tracking-wide">{error}</p>}
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isLoading || code.length !== 6}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-sm tracking-widest uppercase font-light transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? t.verifying : t.verify}
            </button>
            <div className="flex justify-between text-xs font-light text-foreground/40">
              <button
                type="button"
                onClick={() => { setStep('email'); setCode(''); setError(null); }}
                className="hover:text-foreground/70 transition-colors"
              >
                {t.back}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="hover:text-foreground/70 transition-colors disabled:opacity-50"
              >
                {t.resendCode}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Profile */}
        {step === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-5 text-left">
            {lookup?.found ? (
              <>
                <p className="text-sm font-light text-foreground/70 text-center mb-4">
                  {t.foundOnInvite}
                </p>
                <div className="space-y-2">
                  {nameOptions.map((name) => (
                    <label
                      key={name}
                      className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
                        selectedName === name
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-foreground/10 hover:border-foreground/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="guestName"
                        value={name}
                        checked={selectedName === name}
                        onChange={() => setSelectedName(name)}
                        className="accent-primary"
                      />
                      <span className="font-light text-foreground">{name}</span>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-light text-foreground/70 text-center mb-4">
                  {t.tellUsAboutYou}
                </p>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs tracking-wider uppercase font-light text-foreground/60">
                      {t.title} *
                    </Label>
                    <select
                      required
                      value={customName.title}
                      onChange={(e) => setCustomName((p) => ({ ...p, title: e.target.value }))}
                      className="w-full border-b border-foreground/20 focus:border-primary bg-transparent py-2 font-light text-foreground outline-none mt-1"
                    >
                      {TITLES.map((t) => (
                        <option key={t} value={t} disabled={t === ''}>{t || '—'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs tracking-wider uppercase font-light text-foreground/60">
                      {t.firstName} *
                    </Label>
                    <input
                      required
                      value={customName.firstName}
                      onChange={(e) => setCustomName((p) => ({ ...p, firstName: e.target.value }))}
                      className="w-full border-b border-foreground/20 focus:border-primary bg-transparent py-2 font-light text-foreground outline-none mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs tracking-wider uppercase font-light text-foreground/60">
                      {t.lastName} *
                    </Label>
                    <input
                      required
                      value={customName.lastName}
                      onChange={(e) => setCustomName((p) => ({ ...p, lastName: e.target.value }))}
                      className="w-full border-b border-foreground/20 focus:border-primary bg-transparent py-2 font-light text-foreground outline-none mt-1"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Language preference */}
            <div className="pt-2">
              <Label className="text-xs tracking-wider uppercase font-light text-foreground/60">
                {t.preferredLanguage}
              </Label>
              <div className="flex gap-3 mt-2">
                {(['en', 'zh'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    className={`flex-1 py-2 text-sm font-light border transition-colors ${
                      lang === l
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-foreground/20 text-foreground/50 hover:border-foreground/40'
                    }`}
                  >
                    {l === 'en' ? 'English' : '中文'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-sm tracking-widest uppercase font-light transition-all duration-300"
            >
              {t.continue}
            </button>
          </form>
        )}

        {/* Language toggle (steps 1 & 2 only) */}
        {step !== 'profile' && (
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            className="mt-8 text-xs font-light text-foreground/40 hover:text-foreground/70 tracking-wider transition-colors duration-300"
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>
        )}

        {/* Help section — always visible */}
        <div className="mt-10 space-y-3">
          {error && !helpSent && (
            <button
              type="button"
              onClick={async () => {
                await reportIssue({ email, name: selectedName || customName.firstName, issue: error });
                setHelpSent(true);
              }}
              className="w-full text-xs font-light text-foreground/50 hover:text-foreground/80 border border-foreground/10 hover:border-foreground/25 py-2 transition-colors duration-300"
            >
              {lang === 'zh' ? '发送帮助请求给我们' : 'Send us a help request'}
            </button>
          )}
          {helpSent && (
            <p className="text-xs font-light text-foreground/50">
              {lang === 'zh' ? '已发送！我们会尽快与您联系。' : "We'll be in touch shortly — help request sent."}
            </p>
          )}
          <p className="text-xs font-light text-foreground/30">
            {lang === 'zh' ? '需要帮助？' : 'Need help?'}{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="underline hover:text-foreground/60 transition-colors">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>

        <div className="h-px w-16 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto mt-8" />
      </div>
    </div>
  );
}
