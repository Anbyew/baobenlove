import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { lang, toggle, t } = useLang();

  const navItems = [
    { label: t.home, path: '/' },
    { label: t.gallery, path: '/gallery' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-sm border-b border-foreground/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl font-light tracking-wider text-foreground hover:text-primary transition-colors duration-300"
          >
            {t.navLogo}
          </Link>

          {/* Desktop Navigation */}
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
            <button
              onClick={toggle}
              className="text-xs font-light text-foreground/50 hover:text-foreground border border-foreground/20 hover:border-foreground/40 rounded-full px-3 py-1 transition-all duration-300"
            >
              {lang === 'en' ? '中文' : 'EN'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-foreground/60 hover:text-foreground transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-6 space-y-1 border-t border-foreground/5">
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
            <div className="px-6 py-3">
              <button
                onClick={toggle}
                className="text-xs font-light text-foreground/50 hover:text-foreground border border-foreground/20 hover:border-foreground/40 rounded-full px-3 py-1 transition-all duration-300"
              >
                {lang === 'en' ? '中文' : 'EN'}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}