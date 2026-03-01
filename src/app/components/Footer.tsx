export function Footer() {
  return (
    <footer className="bg-background border-t border-foreground/5 py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto mb-12" />
        
        <p className="text-sm font-light tracking-wider text-foreground/60 mb-2">Yuwei Bao & Benjamin Krakoff</p>
        <p className="text-xs font-light text-foreground/40 mb-12">October 3, 2026 • Longwood Gardens</p>

        <div className="text-xs font-light text-foreground/40 space-y-3">
          <p>
            <a href="mailto:bellabenbao@gmail.com" className="text-primary/70 hover:text-primary transition-colors">
              bellabenbao@gmail.com
            </a>
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-foreground/5">
          <p className="text-xs font-light text-foreground/30">© 2026</p>
        </div>
      </div>
    </footer>
  );
}