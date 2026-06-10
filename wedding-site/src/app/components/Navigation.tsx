import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X, UserRound } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useGuestSession } from '../context/GuestSessionContext';
import { useGuestIdentity } from '../context/GuestIdentityContext';

function ProfileLink() {
  const { identity } = useGuestIdentity();
  if (!identity) return null;

  return (
    <Link
      to="/profile"
      className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-foreground/50 hover:text-primary transition-colors duration-300 group"
    >
      <UserRound className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
      {identity.name}
    </Link>
  );
}

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t } = useLang();
  const { invite } = useGuestSession();

  const navItems = [
    { label: t.home, path: '/' },
    { label: t.story, path: '/story' },
    { label: t.details, path: '/details' },
    { label: t.schedule, path: '/schedule' },
    { label: t.rsvp, path: '/rsvp' },
    { label: t.travel, path: '/travel' },
    { label: t.registry, path: '/registry' },
    { label: t.faq, path: '/faq' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-sm border-b border-foreground/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20">
          {/* Logo — left */}
          <div className="flex-1">
            <Link
              to="/"
              className="text-xl font-light tracking-wider text-foreground hover:text-primary transition-colors duration-300"
            >
              {t.navLogo}
            </Link>
          </div>

          {/* Nav items — centered */}
          <div className="hidden lg:flex items-center space-x-10">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm tracking-wider uppercase font-light transition-all duration-300 relative group ${
                  isActive(item.path)
                    ? 'text-primary'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-1 left-0 h-px bg-primary transition-all duration-300 ${
                    isActive(item.path) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            ))}
          </div>

          {/* Profile link — right */}
          <div className="hidden lg:flex flex-1 justify-end">
            <ProfileLink />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-foreground/60 hover:text-foreground transition-colors ml-auto"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-6 space-y-1 border-t border-foreground/5">
            {invite && (
              <div className="px-6 py-3 text-[11px] tracking-[0.24em] uppercase text-foreground/45">
                Viewing as {invite.partyName}
              </div>
            )}
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block px-6 py-3 text-sm tracking-wider uppercase font-light transition-colors ${
                  isActive(item.path)
                    ? 'text-primary'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-6 py-3 text-sm font-light text-foreground/50 hover:text-primary transition-colors"
            >
              <UserRound className="w-4 h-4" />
              Profile
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
