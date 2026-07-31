import { motion } from 'motion/react';
import { Reveal } from '../components/Reveal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { useLang } from '../context/LanguageContext';
import { useGuestIdentity } from '../context/GuestIdentityContext';
import { trackClick } from '../lib/auth';

function renderAnswer(text: string, sessionToken: string | undefined) {
  // Handles [label](url) links and bare email addresses
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
  return parts.map((part, i) => {
    if (i % 2 === 0) return part;
    const md = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (md) {
      return (
        <a
          key={i}
          href={md[2]}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick({ sessionToken, label: 'faq_link_click', metadata: { target: md[1] } })}
          className="text-primary hover:text-primary/80 transition-colors"
        >
          {md[1]}
        </a>
      );
    }
    return (
      <a
        key={i}
        href={`mailto:${part}`}
        onClick={() => trackClick({ sessionToken, label: 'faq_email_click', metadata: { email: part } })}
        className="text-primary hover:text-primary/80 transition-colors"
      >
        {part}
      </a>
    );
  });
}

export function FAQ() {
  const { t } = useLang();
  const { identity } = useGuestIdentity();
  const sections = t.faqSections;
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0">
        <img src="/Wedding Cherries Web/IMG_0390.jpg" alt="Garden background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/25 to-white/45" />
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <div className="relative py-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-sm" />
            <div className="relative">
              <motion.div
                className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-12"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.1 }}
              />
              <div className="overflow-hidden mb-6">
                <motion.div
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h1 className="text-5xl md:text-7xl font-light text-foreground tracking-tight">{t.faqTitle}</h1>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Content panel */}
        <div className="max-w-3xl mx-auto px-4 pb-32">
          <div className="bg-white/80 backdrop-blur-xl shadow-2xl shadow-black/8 border border-white/50 p-8 md:p-16 rounded-sm space-y-16">
            {sections.map((section, si) => (
              <div key={section.heading}>
                <Reveal>
                  <div className={`text-xs tracking-[0.3em] uppercase font-light mb-8 ${section.color}`}>
                    {section.heading}
                  </div>
                </Reveal>

                <Accordion type="single" collapsible className="w-full">
                  {section.items.map((item, ii) => (
                    <Reveal key={ii} delay={ii * 0.08}>
                      <AccordionItem value={`${si}-${ii}`} className="border-foreground/8">
                        <AccordionTrigger className="text-base md:text-lg font-light text-foreground hover:text-primary hover:no-underline text-left py-5 transition-colors duration-300 [&[data-state=open]]:text-primary">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-base font-light text-foreground/75 leading-relaxed pb-5">
                          {renderAnswer(item.a, identity?.sessionToken)}
                        </AccordionContent>
                      </AccordionItem>
                    </Reveal>
                  ))}
                </Accordion>

                {si < sections.length - 1 && (
                  <Reveal delay={0.1}>
                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-foreground/10 to-transparent mx-auto mt-16" />
                  </Reveal>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
