import { motion } from 'motion/react';
import { Reveal } from '../components/Reveal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

const sections = [
  {
    heading: 'Ceremony & Venue',
    color: 'text-primary/55',
    items: [
      {
        q: 'Is the ceremony indoors or outdoors?',
        a: "The ceremony will be held outdoors in Longwood Gardens' Open Air Theatre. The cocktail hour and reception follow indoors at the Terrace Restaurant. In the unlikely event of inclement weather, we have a beautiful indoor backup plan in place.",
      },
      {
        q: 'Where exactly is Longwood Gardens?',
        a: 'Longwood Gardens is located at 1001 Longwood Road, Kennett Square, Pennsylvania 19348 — about 30 miles southwest of Philadelphia.',
      },
      {
        q: 'Is there parking available?',
        a: 'Yes — parking at Longwood Gardens is complimentary. Valet service will also be available at the main entrance.',
      },
      {
        q: 'Will there be transportation between the venue and hotels?',
        a: 'Complimentary shuttles will run between our recommended hotels and the venue throughout the evening. Shuttle details will be shared closer to the date.',
      },
    ],
  },
  {
    heading: 'Attire & Logistics',
    color: 'text-secondary/55',
    items: [
      {
        q: 'What is the dress code?',
        a: 'Formal garden attire. We encourage garden-appropriate colors — think florals, jewel tones, and soft neutrals. Because the ceremony is outdoors on grass and gravel paths, we recommend block heels, wedges, or flats for ladies.',
      },
      {
        q: 'What will the weather be like?',
        a: 'October in Pennsylvania is typically beautiful — crisp autumn air with temperatures around 60–70°F during the day and cooler in the evening. We recommend bringing a light jacket or wrap for after sundown.',
      },
      {
        q: 'Can I take photos during the ceremony?',
        a: 'We kindly ask that you be fully present during the ceremony and refrain from using your phone or camera — we have a wonderful photographer capturing every moment. You are absolutely welcome to photograph freely during the cocktail hour and reception.',
      },
      {
        q: 'Are children welcome?',
        a: 'We love your little ones! Please check your invitation for the number of guests included in your party.',
      },
    ],
  },
  {
    heading: 'RSVP & Registry',
    color: 'text-primary/55',
    items: [
      {
        q: 'When is the RSVP deadline?',
        a: 'Please RSVP by August 1, 2026 so we can finalize our headcount with the venue and caterers.',
      },
      {
        q: 'Can I bring a plus-one?',
        a: 'Due to venue capacity, we can only accommodate guests named on the invitation. Your invitation will indicate whether a guest is included for you.',
      },
      {
        q: 'Do you accommodate dietary restrictions?',
        a: 'Absolutely. Please let us know about any dietary restrictions or allergies in your RSVP and we will make sure the catering team takes great care of you.',
      },
      {
        q: 'Where are you registered?',
        a: 'Our registry information is on the Registry page. Your presence at our wedding is the greatest gift — but if you wish to give, we are grateful.',
      },
      {
        q: 'Who can I contact if I have more questions?',
        a: 'Please reach out to us at bellabenbao@gmail.com — we are happy to help.',
      },
    ],
  },
];

export function FAQ() {
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0">
        <img src="/backgrounds/bg5.jpg" alt="Garden background" className="w-full h-full object-cover" />
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
                  <h1 className="text-5xl md:text-7xl font-light text-foreground tracking-tight">Q&amp;A</h1>
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
                          {item.a}
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
