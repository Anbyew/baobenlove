import { useState } from 'react';
import { Label } from './ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { useGuestIdentity, type GuestIdentity } from '../context/GuestIdentityContext';
import { useLang } from '../context/LanguageContext';
import { sendOtp, verifyOtp, lookupByEmail } from '../lib/auth';

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
  const { identity, setIdentity } = useGuestIdentity();
  const { lang, setLang, t } = useLang();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpState, setOtpState] = useState<OtpState | null>(null);
  const [code, setCode] = useState('');
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [customName, setCustomName] = useState({ title: '', firstName: '', lastName: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await verifyOtp({ email: email.trim().toLowerCase(), code, token: otpState.token, expiresAt: otpState.expiresAt });
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

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let name: string;
    if (lookup?.found) {
      name = selectedName;
    } else {
      name = [customName.title, customName.firstName, customName.lastName].filter(Boolean).join(' ');
    }
    const next: GuestIdentity = {
      email: email.trim().toLowerCase(),
      name,
      language: lang,
      verifiedAt: new Date().toISOString(),
    };
    setIdentity(next);
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
              onClick={handleVerifyOtp}
              disabled={isLoading || code.length !== 6}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-sm tracking-widest uppercase font-light transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? t.verifying : t.verify}
            </button>
            <div className="flex justify-between text-xs font-light text-foreground/40">
              <button
                onClick={() => { setStep('email'); setCode(''); setError(null); }}
                className="hover:text-foreground/70 transition-colors"
              >
                {t.back}
              </button>
              <button
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
                      {t.title}
                    </Label>
                    <select
                      value={customName.title}
                      onChange={(e) => setCustomName((p) => ({ ...p, title: e.target.value }))}
                      className="w-full border-b border-foreground/20 focus:border-primary bg-transparent py-2 font-light text-foreground outline-none mt-1"
                    >
                      {TITLES.map((t) => (
                        <option key={t} value={t}>{t || '—'}</option>
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
                      {t.lastName}
                    </Label>
                    <input
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
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            className="mt-8 text-xs font-light text-foreground/40 hover:text-foreground/70 tracking-wider transition-colors duration-300"
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>
        )}

        <div className="h-px w-16 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto mt-12" />
      </div>
    </div>
  );
}
