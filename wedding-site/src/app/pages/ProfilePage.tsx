import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useGuestIdentity, parseName } from '../context/GuestIdentityContext';
import { useLang } from '../context/LanguageContext';
import { updateSession } from '../lib/auth';
import { Label } from '../components/ui/label';

const TITLES = ['', 'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];

export function ProfilePage() {
  const { identity, setIdentity } = useGuestIdentity();
  const { setLang } = useLang();
  const navigate = useNavigate();

  const initial = () => {
    if (!identity) return { title: '', firstName: '', lastName: '', language: 'en' as const };
    const parsed = identity.firstName
      ? { title: identity.title ?? '', firstName: identity.firstName, lastName: identity.lastName ?? '' }
      : parseName(identity.name);
    return {
      title: parsed.title,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      language: identity.language,
    };
  };

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!identity) {
    navigate('/');
    return null;
  }

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title || !form.firstName.trim() || !form.lastName.trim() || !form.language) {
      setError('Please complete every field before saving.');
      return;
    }

    setSaving(true);

    try {
      const fullName = [form.title, form.firstName.trim(), form.lastName.trim()].join(' ');

      if (identity.sessionToken) {
        await updateSession(identity.sessionToken, {
          name: fullName,
          language: form.language,
        });
      }

      setIdentity({
        ...identity,
        name: fullName,
        title: form.title,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        language: form.language,
      });

      setLang(form.language);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-start justify-center pt-32 pb-24 px-4">
      <div className="w-full max-w-sm">
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-12" />

        <h1 className="text-2xl font-light text-foreground tracking-tight text-center mb-2">
          Your Profile
        </h1>
        <p className="text-sm font-light text-foreground/50 text-center tracking-wide mb-10">
          {identity.email}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label className="text-xs tracking-wider uppercase font-light text-foreground/50">
              Title *
            </Label>
            <select
              required
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="w-full border-b border-foreground/20 focus:border-primary bg-transparent py-2 font-light text-foreground outline-none mt-1 transition-colors duration-300"
            >
              {TITLES.map(t => (
                <option key={t} value={t}>{t || '—'}</option>
              ))}
            </select>
          </div>

          {/* First Name */}
          <div>
            <Label className="text-xs tracking-wider uppercase font-light text-foreground/50">
              First Name *
            </Label>
            <input
              required
              value={form.firstName}
              onChange={e => set('firstName', e.target.value)}
              className="w-full border-b border-foreground/20 focus:border-primary bg-transparent py-2 font-light text-foreground outline-none mt-1 transition-colors duration-300"
            />
          </div>

          {/* Last Name */}
          <div>
            <Label className="text-xs tracking-wider uppercase font-light text-foreground/50">
              Last Name *
            </Label>
            <input
              required
              value={form.lastName}
              onChange={e => set('lastName', e.target.value)}
              className="w-full border-b border-foreground/20 focus:border-primary bg-transparent py-2 font-light text-foreground outline-none mt-1 transition-colors duration-300"
            />
          </div>

          {/* Language */}
          <div>
            <Label className="text-xs tracking-wider uppercase font-light text-foreground/50">
              Preferred Language *
            </Label>
            <div className="flex gap-3 mt-2">
              {(['en', 'zh'] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => set('language', l)}
                  className={`flex-1 py-2 text-sm font-light border transition-colors duration-300 ${
                    form.language === l
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-foreground/20 text-foreground/50 hover:border-foreground/40'
                  }`}
                >
                  {l === 'en' ? 'English' : '中文'}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive font-light tracking-wide">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3 text-sm tracking-widest uppercase font-light border border-foreground/20 text-foreground/50 hover:border-foreground/40 transition-all duration-300"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 text-sm tracking-widest uppercase font-light transition-all duration-300 disabled:opacity-50"
            >
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
            </button>
          </div>
        </form>

        <div className="h-px w-16 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto mt-12" />
      </div>
    </div>
  );
}
