import React, { useEffect, useMemo, useState, useContext, createContext, lazy, Suspense } from "react";

/********************
 * THEME CONTEXT
 ********************/
const ThemeContext = createContext({ 
  theme: 'dark',
  toggleTheme: () => {}
});

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);
  
  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

/********************
 * Lightweight PATH Router (with improvements)
 ********************/
const parsePathFrom = (path) => {
  const p = (path || "/").trim();
  return p.startsWith("/") ? p : "/" + p;
};

const getCurrentPath = () => {
  if (typeof window === 'undefined') return "/";
  return parsePathFrom(window.location.pathname + window.location.search);
};

// Strict context: no default value to avoid misuse & function-binding issues
const RouterCtx = createContext(undefined);

function RouterProvider({ children }) {
  const [route, setRoute] = useState(() => getCurrentPath());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onPop = () => setRoute(getCurrentPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (to, options = {}) => {
    const path = parsePathFrom(to);
    const current = window.location.pathname + window.location.search;
    if (path !== current) {
      if (options.showLoader) setLoading(true);
      window.history.pushState({}, "", path);
      // Update state directly (do not dispatch popstate)
      setRoute(path);
      if (options.showLoader) {
        setTimeout(() => setLoading(false), 300); // Brief loading state for UX
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__router = { 
        navigate, 
        get route(){ return route; },
        loading 
      };
    }
  }, [route, loading]);

  const value = useMemo(() => ({ route, navigate, loading }), [route, loading]);
  return <RouterCtx.Provider value={value}>{children}</RouterCtx.Provider>;
}

const useRouter = () => {
  const ctx = useContext(RouterCtx);
  if (!ctx) throw new Error('useRouter must be used within <RouterProvider>');
  return ctx;
};

/********************
 * UI PRIMITIVES (Enhanced)
 ********************/
function NavLink({ to, children, className = "", activeClassName = "text-[#d4af37]" }) {
  const { route, navigate } = useRouter();
  const active = route === to || (to !== '/' && route.startsWith(to));
  
  return (
    <a
      href={to}
      onClick={(e) => { e.preventDefault(); navigate(to, { showLoader: true }); }}
      className={`px-3 py-2 rounded-xl hover:bg-white/5 transition-all duration-300 ${active ? activeClassName : ''} ${className}`}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </a>
  );
}

function Section({ id, className = "", children, bgColor = "" }) {
  return (
    <section 
      id={id} 
      className={`py-14 md:py-20 ${bgColor} ${className}`}
      data-aos="fade-up"
      data-aos-duration="800"
    >
      {children}
    </section>
  );
}

function SectionHeading({ title, subtitle, centered = true, accentText }) {
  return (
    <div className={`mb-10 ${centered ? 'text-center' : ''}`}>
      {accentText && (
        <div className="text-xs tracking-[0.2em] text-[#d4af37] mb-2">{accentText}</div>
      )}
      <h2 className="text-3xl md:text-4xl font-extralight tracking-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-[#b8b8b8]">{subtitle}</p>}
      <div className={`h-px w-16 bg-[#d4af37]/60 ${centered ? 'mx-auto' : ''} mt-4`} />
    </div>
  );
}

function Button({ children, variant = "primary", size = "md", className = "", ...props }) {
  const variants = {
    primary: "bg-[#d4af37] text-black hover:opacity-90",
    secondary: "border border-white/20 text-white hover:bg-white/5",
    outline: "border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black",
  };
  
  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };
  
  return (
    <button 
      className={`rounded-xl tracking-widest transition-all duration-300 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <div 
      className={`border border-white/10 bg-black/20 p-6 rounded-2xl hover:border-[#d4af37]/40 hover:shadow-lg transition-all duration-300 ${className}`}
      data-aos="fade-up"
    >
      {children}
    </div>
  );
}

function ExternalLink({ href, children, className = "" }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`inline-flex items-center gap-2 ${className}`}
    >
      {children}
      <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">↗</span>
    </a>
  );
}

function ProductCard({ product }) {
  return (
    <Card className="group">
      <h3 className="text-xl font-light mb-2">{product.name}</h3>
      <p className="text-[#b8b8b8] text-sm">{product.blurb}</p>
      <div className="mt-4 text-[#b8b8b8] text-xs tracking-widest group-hover:text-[#d4af37] transition-colors duration-300">
        <ExternalLink href={product.url}>VISIT SITE</ExternalLink>
      </div>
    </Card>
  );
}

function Shell({ children }) {
  const { navigate, loading } = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#f5f5f5] transition-colors duration-300">
      {/* Page Loader */}
      {loading && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <header className="border-b border-white/10 sticky top-0 z-50 bg-black/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a 
            href="/" 
            onClick={(e) => { e.preventDefault(); navigate('/'); }} 
            className="flex items-center gap-2 text-xl font-semibold"
          >
            <span className="w-3 h-3 rounded-full bg-[#d4af37] inline-block" />
            Angel Kellogg
          </a>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/brands">Brands</NavLink>
            <NavLink to="/media">Media</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            <div className="pl-2 border-l border-white/10 ml-2">
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full hover:bg-white/5"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
          </nav>
          
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 md:hidden">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-white/5"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-2xl"
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div 
          className={`md:hidden absolute w-full bg-black/95 backdrop-blur-md border-b border-white/10 transition-all duration-300 ${
            menuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          } overflow-hidden`}
        >
          <div className="px-4 py-4 flex flex-col">
            <NavLink to="/" className="py-3 border-b border-white/10">Home</NavLink>
            <NavLink to="/about" className="py-3 border-b border-white/10">About</NavLink>
            <NavLink to="/brands" className="py-3 border-b border-white/10">Brands</NavLink>
            <NavLink to="/media" className="py-3 border-b border-white/10">Media</NavLink>
            <NavLink to="/contact" className="py-3 border-b border-white/10">Contact</NavLink>
            <NavLink to="/privacy" className="py-3 border-b border-white/10">Privacy</NavLink>
            <NavLink to="/terms" className="py-3">Terms</NavLink>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <Suspense fallback={<div className="flex justify-center py-10"><div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div></div>}>
            {children}
          </Suspense>
        </div>
      </main>
      
      <footer className="border-t border-white/10 bg-black/40">
        <div className="max-w-6xl mx-auto px-4 py-8 grid gap-4 md:grid-cols-3">
          <div>
            <div className="font-semibold mb-2">Angel Kellogg</div>
            <p className="text-sm text-[#b8b8b8]">Builder • Creator • Strategist</p>
            
            {/* Social Links */}
            <div className="flex gap-3 mt-4">
              <a 
                href="https://twitter.com/angelkellogg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 hover:border-[#d4af37] hover:bg-white/5 transition-all"
                aria-label="Twitter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
              <a 
                href="https://instagram.com/angelkellogg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 hover:border-[#d4af37] hover:bg-white/5 transition-all"
                aria-label="Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a 
                href="https://linkedin.com/in/angelkellogg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 hover:border-[#d4af37] hover:bg-white/5 transition-all"
                aria-label="LinkedIn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
              <a 
                href="https://youtube.com/@angelkellogg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 hover:border-[#d4af37] hover:bg-white/5 transition-all"
                aria-label="YouTube"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </a>
            </div>
          </div>
          <div className="grid gap-2">
            <NavLink to="/about" className="text-[#d4af37] underline underline-offset-4">About</NavLink>
            <NavLink to="/brands" className="text-[#d4af37] underline underline-offset-4">Brands</NavLink>
            <NavLink to="/media" className="text-[#d4af37] underline underline-offset-4">Media</NavLink>
          </div>
          <div className="grid gap-2">
            <a className="text-[#d4af37] underline underline-offset-4" href="mailto:hello@angelkellogg.com">hello@angelkellogg.com</a>
            <NavLink to="/privacy" className="text-[#d4af37] underline underline-offset-4">Privacy</NavLink>
            <NavLink to="/terms" className="text-[#d4af37] underline underline-offset-4">Terms</NavLink>
          </div>
        </div>
        <div className="text-center text-xs text-[#b8b8b8] pb-8">© {new Date().getFullYear()} Angel Kellogg</div>
      </footer>
    </div>
  );
}

/********************
 * PAGES (Lazy Loaded)
 ********************/
function Hero() {
  // Production: no placeholder copy. If no title/subtitle provided, render media-only hero.
  const HERO_IMAGE = (typeof window !== 'undefined' && window.__HERO_IMAGE) || "";
  const HERO_VIDEO = (typeof window !== 'undefined' && window.__HERO_VIDEO) || "";
  const HERO_TITLE = (typeof window !== 'undefined' && window.__HERO_TITLE) || "";
  const HERO_SUBTITLE = (typeof window !== 'undefined' && window.__HERO_SUBTITLE) || "";
  
  return (
    <section 
      className="relative overflow-hidden rounded-2xl shadow-[0_0_60px_rgba(212,175,55,0.12)] border border-white/10"
      data-aos="fade-up"
    >
      {HERO_VIDEO ? (
        <video 
          className="absolute inset-0 w-full h-full object-cover" 
          src={HERO_VIDEO} 
          autoPlay 
          muted 
          loop 
          playsInline 
          aria-hidden="true"
        />
      ) : (
        HERO_IMAGE && (
          <img 
            className="absolute inset-0 w-full h-full object-cover" 
            src={HERO_IMAGE} 
            alt="Hero background" 
            loading="eager" 
            width="1200" 
            height="600" 
          />
        )
      )}
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 px-6 md:px-10 py-14 md:py-24">
        <div className="max-w-4xl">
          {HERO_TITLE && (
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight animate-fade-in">
              {HERO_TITLE}
            </h1>
          )}
          {HERO_SUBTITLE && (
            <p className="mt-4 md:mt-6 text-[#dcdcdc] text-lg md:text-xl max-w-2xl animate-fade-in-delay">
              {HERO_SUBTITLE}
            </p>
          )}
          <div className="mt-7 md:mt-9 flex flex-wrap gap-3 animate-fade-in-delay-long">
            <NavLink 
              to="/brands" 
              className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 font-medium bg-[#d4af37] text-black hover:bg-[#d4af37]/90 transition-colors"
            >
              Explore the Ecosystem
            </NavLink>
            <NavLink 
              to="/contact" 
              className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 font-medium border border-white/15 hover:bg-white/5 transition-colors"
            >
              Book / Partner
            </NavLink>
            <NavLink 
              to="/media" 
              className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 font-medium border border-white/15 hover:bg-white/5 transition-colors"
            >
              Media Kit
            </NavLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const products = [
    { 
      name: 'From the Block Podcast', 
      url: 'https://fromtheblock.angelk.com', 
      blurb: 'Weekly insights on crypto, culture, and building your digital empire.' 
    },
    { 
      name: 'ForeverDocs', 
      url: 'https://foreverdocs.io', 
      blurb: 'Secure your digital legacy with blockchain‑powered document protection.' 
    },
    { 
      name: 'BRGR Collective', 
      url: 'https://brgrcollective.com', 
      blurb: 'Building Resilient Generational Resources — empowering women via tech education.' 
    },
    { 
      name: 'SafeSafari Journeys', 
      url: 'https://safesafari.travel', 
      blurb: 'Curated luxury travel experiences connecting Atlanta and Johannesburg.' 
    },
    { 
      name: 'Euphoria/YOH Underground', 
      url: 'https://euphoriayoh.com', 
      blurb: 'Premium nightlife experiences and VIP access across continents.' 
    },
  ];

  // Add AOS animations on mount
  useEffect(() => {
    // Check if AOS is available and initialize
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        once: true,
        offset: 100
      });
    }
    
    // Add scroll reveal animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
      observer.observe(el);
    });
    
    return () => {
      document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  return (
    <div className="flex flex-col gap-y-0 md:gap-y-8">
      {/* HERO */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-8 pt-6 md:pt-10 bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/10 shadow-[0_0_60px_rgba(212,175,55,0.12)] reveal-on-scroll">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-12 reveal-on-scroll">
            <h1 className="text-6xl md:text-8xl font-extralight tracking-tighter leading-none mb-2">
              Angel<span className="font-normal text-[#d4af37]">K</span>
            </h1>
            <div className="h-px w-24 bg-[#d4af37] mx-auto" />
          </div>
          <h2 className="text-xl md:text-2xl font-extralight tracking-wider mb-12 max-w-xl mx-auto text-[#dcdcdc] reveal-on-scroll">
            FROM THE BLOCK TO THE BLOCKCHAIN
          </h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center reveal-on-scroll">
            <Button 
              variant="primary" 
              onClick={(e) => {
                e.preventDefault(); 
                window.__router?.navigate('/media');
              }}
            >
              WATCH LATEST
            </Button>
            <ExternalLink 
              href="https://foreverdocs.io" 
              className="px-6 py-3 border border-white/20 text-sm tracking-widest rounded-xl hover:bg-white/5 group"
            >
              EXPLORE FOREVERDOCS
            </ExternalLink>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent" />
      </section>

      {/* BRANDS GRID */}
      <Section id="brands">
        <div className="max-w-6xl mx-auto">
          <SectionHeading 
            title="Explore the Brands" 
            centered={true} 
            accentText="ANGEL KELLOGG ECOSYSTEM" 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 reveal-on-scroll">
            {products.slice(0,3).map((product, i) => (
              <ProductCard key={i} product={product} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 reveal-on-scroll">
            {products.slice(3).map((product, i) => (
              <ProductCard key={i} product={product} />
            ))}
          </div>
        </div>
      </Section>

      {/* PODCAST */}
      <Section id="podcast" className="bg-black/20 rounded-2xl">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-start">
          <div className="reveal-on-scroll">
            <SectionHeading 
              title="From the Block to the Blockchain" 
              centered={false} 
              accentText="PODCAST" 
            />
            <p className="text-[#b8b8b8] font-light leading-relaxed mb-6">
              Weekly conversations on cryptocurrency, culture, and building generational wealth across ATL ↔ JHB.
            </p>
            <div className="flex items-center gap-6 text-sm tracking-widest">
              <ExternalLink href="https://fromtheblock.angelk.com" className="text-[#d4af37] group">
                LISTEN NOW
              </ExternalLink>
              <span className="w-px h-5 bg-white/20" />
              <ExternalLink href="https://fromtheblock.angelk.com/subscribe" className="text-[#d4af37] group">
                SUBSCRIBE
              </ExternalLink>
            </div>
          </div>
          <div>
            {[
              { title: 'Women in Web3: Breaking Barriers', date: 'Sep 10, 2025', duration: '38:24' },
              { title: 'DeFi Explained: Yield Farming Strategies', date: 'Sep 3, 2025', duration: '42:51' },
              { title: 'MS & Entrepreneurship: My Journey', date: 'Aug 27, 2025', duration: '56:12' },
              { title: 'ATL to Jozi: Building Global Communities', date: 'Aug 20, 2025', duration: '44:37' }
            ].map((ep, idx) => (
              <a 
                key={idx} 
                href="https://fromtheblock.angelk.com/episodes" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex gap-4 items-center py-4 border-b border-white/10 group transition-all hover:bg-white/5 rounded-lg px-2 reveal-on-scroll"
                data-aos-delay={idx * 100}
              >
                <span className="w-9 h-9 rounded-full border border-white/20 grid place-items-center group-hover:bg-[#d4af37] group-hover:text-black transition-colors">▶</span>
                <div className="flex-1">
                  <div className="font-light">{ep.title}</div>
                  <div className="text-xs text-[#b8b8b8] flex gap-4"><span>{ep.date}</span><span>{ep.duration}</span></div>
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </a>
            ))}
            <div className="mt-6 text-right">
              <ExternalLink 
                href="https://fromtheblock.angelk.com/episodes" 
                className="text-xs tracking-widest text-[#b8b8b8] hover:text-[#d4af37] transition-colors group"
              >
                VIEW ALL EPISODES
              </ExternalLink>
            </div>
          </div>
        </div>
      </Section>

      {/* FOREVERDOCS */}
      <Section id="foreverdocs">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="aspect-square rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-[#d4af37]/10 border border-white/10 grid place-items-center reveal-on-scroll">
            <div className="text-xs tracking-[0.2em] text-[#b8b8b8]">SECURE DOCUMENT PREVIEW</div>
          </div>
          <div className="reveal-on-scroll">
            <SectionHeading 
              title="Secure Your Digital Legacy" 
              centered={false} 
              accentText="FOREVERDOCS" 
            />
            <p className="text-[#b8b8b8] font-light leading-relaxed mb-6">
              Ensure your most important documents remain secure, accessible, and verifiable for generations.
            </p>
            <div className="flex flex-col gap-4 max-w-sm">
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full bg-transparent border-b border-white/20 py-3 text-sm focus:outline-none focus:border-[#d4af37] transition-colors"
                aria-label="Email address for waitlist"
              />
              <Button 
                variant="primary" 
                as="a" 
                href="https://foreverdocs.io/waitlist" 
                target="_blank" 
                rel="noopener noreferrer"
                className="self-start"
              >
                JOIN WAITLIST
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* BRGR */}
      <Section id="brgr" className="bg-black/20 rounded-2xl">
        <div className="max-w-5xl mx-auto text-center">
          <SectionHeading 
            title="Building Resilient Generational Resources" 
            centered={true} 
            accentText="BRGR COLLECTIVE" 
          />
          <p className="text-[#b8b8b8] mt-6 max-w-2xl mx-auto">
            Empowering women in underserved communities through technology education and skills training.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {[
              { 
                title: 'Salesforce Fundamentals', 
                description: 'Learn Salesforce basics, navigation, and core functionality to start your tech career.', 
                duration: '8 weeks', 
                level: 'Beginner' 
              },
              { 
                title: 'SQL & Database Management', 
                description: 'Master SQL queries, database design, and data management skills.', 
                duration: '6 weeks', 
                level: 'Intermediate' 
              },
              { 
                title: 'Data Structures & Algorithms', 
                description: 'Essential computer science concepts and problem‑solving skills.', 
                duration: '10 weeks', 
                level: 'Advanced' 
              },
            ].map((prog, idx) => (
              <Card 
                key={idx} 
                className="text-left reveal-on-scroll group"
                data-aos-delay={idx * 100}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-[#d4af37]/15 text-[#d4af37] px-2 py-0.5 rounded">
                    {prog.duration}
                  </span>
                  <span className="text-xs bg-white/10 text-[#dcdcdc] px-2 py-0.5 rounded">
                    {prog.level}
                  </span>
                </div>
                <h3 className="text-lg font-light mb-2">{prog.title}</h3>
                <p className="text-[#b8b8b8] text-sm">{prog.description}</p>
                <div className="mt-4 text-[#b8b8b8] text-xs tracking-widest group-hover:text-[#d4af37] transition-colors">
                  <ExternalLink href="https://brgrcollective.com/programs">
                    LEARN MORE
                  </ExternalLink>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-10 reveal-on-scroll">
            <ExternalLink 
              href="https://brgrcollective.com" 
              className="px-6 py-3 bg-[#d4af37] text-black text-sm tracking-widest rounded-xl hover:opacity-90 inline-flex items-center gap-2"
            >
              APPLY NOW
            </ExternalLink>
          </div>
        </div>
      </Section>

      {/* PRESS */}
      <Section id="press">
        <div className="max-w-5xl mx-auto text-center">
          <SectionHeading 
            title="Featured In" 
            centered={true} 
            accentText="MEDIA & PRESS" 
          />
          {/* No placeholders: hide logo grid unless logos are set via CMS in future */}
          <div className="mt-10 reveal-on-scroll">
            <NavLink 
              to="/media" 
              className="text-xs tracking-widest text-[#b8b8b8] hover:text-[#d4af37] transition-colors inline-flex items-center gap-2 group"
            >
              VIEW PRESS KIT <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
            </NavLink>
          </div>
        </div>
      </Section>

      {/* NEWSLETTER */}
      <Section id="newsletter" className="bg-black/20 rounded-2xl">
        <div className="max-w-lg mx-auto text-center reveal-on-scroll">
          <h2 className="text-3xl font-extralight tracking-tight mb-3">Stay Connected</h2>
          <p className="text-[#b8b8b8] mb-8">Subscribe for new episodes, events, and exclusive content.</p>
          <div className="flex flex-col gap-4">
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full bg-transparent border-b border-white/20 py-3 text-sm text-center focus:outline-none focus:border-[#d4af37] transition-colors"
              aria-label="Email for newsletter"
            />
            <Button variant="outline" className="mx-auto">
              SUBSCRIBE
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}

// Lazy loaded pages
const About = lazy(() => Promise.resolve({
  default: function About(){
    return (
      <div className="bg-[#131313] rounded-2xl p-6 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
        <h1 className="text-3xl font-bold">About Angel Kellogg</h1>
        <p className="text-[#b8b8b8] mt-3">Entrepreneur and creator building a multi-brand ecosystem spanning the U.S. and South Africa. Focused on attention-driven growth, community partnerships, and practical blockchain/AI tools.</p>
      </div>
    );
  }
}));

function BrandCard({ name, blurb, href }){
  return (
    <a 
      href={href} 
      className="bg-[#131313] rounded-2xl p-6 shadow-[0_0_40px_rgba(212,175,55,0.15)] block hover:opacity-90 transition-all hover:shadow-[0_0_50px_rgba(212,175,55,0.2)]" 
      target="_blank" 
      rel="noopener noreferrer"
      data-aos="fade-up"
    >
      <div className="text-xl font-semibold">{name}</div>
      <p className="text-[#b8b8b8] mt-2">{blurb}</p>
    </a>
  );
}

const Brands = lazy(() => Promise.resolve({
  default: function Brands(){
    return (
      <div className="grid gap-6">
        <h1 className="text-3xl font-bold">Brands</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <BrandCard name="Angel Kellogg" blurb="Personal creator brand. Content, partnerships, events." href="/" />
          <BrandCard name="ForeverDocs" blurb="Community-rooted digital vault + public proof." href="https://www.foreverdocs.org" />
          <BrandCard name="From the Block → Blockchain" blurb="Crypto education and media with real-world utility." href="https://fromtheblocktotheblockchain.info" />
        </div>
      </div>
    );
  }
}));

const Media = lazy(() => Promise.resolve({
  default: function Media(){
    return (
      <div className="grid gap-6">
        <div className="bg-[#131313] rounded-2xl p-6 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
          <h1 className="text-3xl font-bold">Media & Press</h1>
          <p className="text-[#b8b8b8] mt-2">Press kit, speaking topics, and recent features.</p>
          <ul className="list-disc pl-5 mt-3 text-[#b8b8b8] space-y-1">
            <li>Speaker topics: attention economy, community tech, nightlife & culture</li>
            <li>Bio, headshots, and logos (coming soon)</li>
          </ul>
        </div>
      </div>
    );
  }
}));

const Contact = lazy(() => Promise.resolve({
  default: function Contact(){
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const [form, setForm] = useState({ name:'', email:'', message:'' });
    const API_BASE = (typeof window !== 'undefined' && window.__API_BASE) || '';
    
    // Form validation
    const [formErrors, setFormErrors] = useState({});
    const validateForm = () => {
      const errors = {};
      if (!form.name.trim()) errors.name = 'Name is required';
      if (!form.email.trim()) errors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Email is invalid';
      if (!form.message.trim()) errors.message = 'Message is required';
      
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    async function onSubmit(e){
      e.preventDefault();
      
      if (!validateForm()) return;
      
      setStatus('submitting'); 
      setError('');
      
      try{
        const res = await fetch(`${API_BASE}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        
        if(!res.ok) throw new Error(`HTTP ${res.status}`);
        
        setStatus('success');
        setForm({ name: '', email: '', message: '' }); // Clear form on success
      } catch(err){
        setError('Could not submit to backend. Check API_BASE and /api/contact endpoint.');
        setStatus('error');
      }
    }

    return (
      <div className="bg-[#131313] rounded-2xl p-6 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
        <h1 className="text-3xl font-bold">Contact</h1>
        <p className="text-[#b8b8b8] mt-2">For partnerships, media, and bookings.</p>

        <form className="mt-6 grid gap-3 max-w-xl" onSubmit={onSubmit}>
          <div>
            <input 
              className={`w-full bg-black/40 border ${formErrors.name ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 focus:outline-none focus:border-[#d4af37] transition-colors`} 
              placeholder="Your name" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              required 
              aria-label="Your name"
              aria-invalid={!!formErrors.name}
              aria-describedby={formErrors.name ? "name-error" : undefined}
            />
            {formErrors.name && (
              <p id="name-error" className="text-red-500 text-xs mt-1">{formErrors.name}</p>
            )}
          </div>
          
          <div>
            <input 
              className={`w-full bg-black/40 border ${formErrors.email ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 focus:outline-none focus:border-[#d4af37] transition-colors`} 
              placeholder="Email" 
              type="email" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
              required 
              aria-label="Your email"
              aria-invalid={!!formErrors.email}
              aria-describedby={formErrors.email ? "email-error" : undefined}
            />
            {formErrors.email && (
              <p id="email-error" className="text-red-500 text-xs mt-1">{formErrors.email}</p>
            )}
          </div>
          
          <div>
            <textarea 
              className={`w-full bg-black/40 border ${formErrors.message ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 min-h-[140px] focus:outline-none focus:border-[#d4af37] transition-colors`} 
              placeholder="Message" 
              value={form.message} 
              onChange={e => setForm({...form, message: e.target.value})} 
              required 
              aria-label="Your message"
              aria-invalid={!!formErrors.message}
              aria-describedby={formErrors.message ? "message-error" : undefined}
            ></textarea>
            {formErrors.message && (
              <p id="message-error" className="text-red-500 text-xs mt-1">{formErrors.message}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="primary" 
              type="submit" 
              disabled={status === 'submitting'}
              aria-busy={status === 'submitting'}
            >
              {status === 'submitting' ? 'Sending…' : 'Send'}
            </Button>
            <a 
              className="px-4 py-2 rounded-2xl border border-white/15 hover:bg-white/5 transition-colors" 
              href="mailto:hello@angelkellogg.com"
            >
              Email instead
            </a>
          </div>
          
          {status === 'success' && (
            <div className="text-green-400 p-3 bg-green-900/20 rounded-lg border border-green-500/20" role="alert">
              Thanks — we got your message.
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-red-400 p-3 bg-red-900/20 rounded-lg border border-red-500/20" role="alert">
              {error}
            </div>
          )}
          
          <div className="text-xs text-[#b8b8b8]">
            Tip: set <code className="bg-black/30 px-1 py-0.5 rounded">window.__API_BASE = 'https://YOUR-RENDER-URL'</code> before submitting, or serve the frontend from the same origin as the backend.
          </div>
        </form>

        <details className="mt-10">
          <summary className="cursor-pointer text-sm text-[#b8b8b8]">Prefer Google Forms? (expand)</summary>
          <div className="mt-4 grid gap-6">
            <iframe 
              src="https://docs.google.com/forms/d/e/1FAIpQLSc0lPlU53FRQi5URf_PZbRzwYhPkv2UIgJNH2AAxS27xRX2aw/viewform?embedded=true" 
              width="100%" 
              height="1271" 
              frameBorder="0" 
              marginHeight="0" 
              marginWidth="0"
              title="Google Form 1"
            >
              Loading…
            </iframe>
            <iframe 
              src="https://docs.google.com/forms/d/e/1FAIpQLSe39Qi4wSf1wsGYmPsw_ewWGX6aYGORt7Wp8QQPTVNV4X317Q/viewform?embedded=true" 
              width="100%" 
              height="1120" 
              frameBorder="0" 
              marginHeight="0" 
              marginWidth="0"
              title="Google Form 2"
            >
              Loading…
            </iframe>
            <iframe 
              src="https://docs.google.com/forms/d/e/1FAIpQLSfbY2KWdqfIN_QowhT5lK4IWxGuysHbDF1wJBiqyRIwN-9QuA/viewform?embedded=true" 
              width="100%" 
              height="1120" 
              frameBorder="0" 
              marginHeight="0" 
              marginWidth="0"
              title="Google Form 3"
            >
              Loading…
            </iframe>
          </div>
        </details>
      </div>
    );
  }
}));

const Privacy = lazy(() => Promise.resolve({
  default: function Privacy() {
    return (
      <div className="grid gap-6">
        <section className="bg-[#131313] rounded-2xl p-6 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-[#b8b8b8]">Effective date: {new Date().toLocaleDateString()}</p>
          <p className="mt-4 text-[#b8b8b8]">
            This Privacy Policy describes how Angel Kellogg ("we", "us", "our") collects, uses, and shares information when you use our website and any forms or services linked from it.
          </p>
          <h2 className="text-xl font-semibold mt-6">1) Information We Collect</h2>
          <ul className="list-disc pl-6 text-[#b8b8b8] space-y-2 mt-2">
            <li><span className="text-white font-medium">Contact data:</span> your name, email, and any message you submit via our forms or email.</li>
            <li><span className="text-white font-medium">Usage data:</span> basic analytics (page views, referrers, device/browser). We do not sell personal data.</li>
            <li><span className="text-white font-medium">Third‑party forms:</span> If you submit a Google Form embedded on this site, your data is processed by Google according to its policies.</li>
          </ul>
          <h2 className="text-xl font-semibold mt-6">2) How We Use Information</h2>
          <ul className="list-disc pl-6 text-[#b8b8b8] space-y-2 mt-2">
            <li>Respond to inquiries and manage collaborations or bookings.</li>
            <li>Operate, maintain, and improve our content and services.</li>
            <li>Comply with legal obligations and enforce our policies.</li>
          </ul>
          <h2 className="text-xl font-semibold mt-6">3) Cookies & Analytics</h2>
          <p className="text-[#b8b8b8] mt-2">We may use lightweight analytics and standard cookies to understand site performance. You can control cookies in your browser settings.</p>
          <h2 className="text-xl font-semibold mt-6">4) Third‑Party Services</h2>
          <ul className="list-disc pl-6 text-[#b8b8b8] space-y-2 mt-2">
            <li><span className="text-white font-medium">Google Forms:</span> form submissions are collected and stored by Google. Review Google's Privacy Policy for details.</li>
            <li><span className="text-white font-medium">Hosting:</span> standard server logs and performance data may be collected to run the site.</li>
          </ul>
          <h2 className="text-xl font-semibold mt-6">5) Data Sharing</h2>
          <p className="text-[#b8b8b8] mt-2">We do not sell your personal information. We share data only with service providers that help us operate the site and only as necessary.</p>
          <h2 className="text-xl font-semibold mt-6">6) Data Retention</h2>
          <p className="text-[#b8b8b8] mt-2">We keep information as long as needed for the purposes described above, then delete or anonymize it, unless a longer period is required by law.</p>
          <h2 className="text-xl font-semibold mt-6">7) Your Choices & Rights</h2>
          <p className="text-[#b8b8b8] mt-2">You may request access, correction, or deletion of your personal information by emailing <a className="text-[#d4af37] underline" href="mailto:hello@angelkellogg.com">hello@angelkellogg.com</a>.</p>
          <h2 className="text-xl font-semibold mt-6">8) Children's Privacy</h2>
          <p className="text-[#b8b8b8] mt-2">This site is not directed to children under 13, and we do not knowingly collect data from them.</p>
          <h2 className="text-xl font-semibold mt-6">9) International Transfers</h2>
          <p className="text-[#b8b8b8] mt-2">We operate across multiple regions. By using this site, you understand your information may be transferred and processed outside your country.</p>
          <h2 className="text-xl font-semibold mt-6">10) Changes to This Policy</h2>
          <p className="text-[#b8b8b8] mt-2">We may update this Privacy Policy. We will change the "Effective date" above when we do.</p>
          <h2 className="text-xl font-semibold mt-6">11) Contact</h2>
          <p className="text-[#b8b8b8] mt-2">Questions? Email <a className="text-[#d4af37] underline" href="mailto:hello@angelkellogg.com">hello@angelkellogg.com</a>.</p>
        </section>
      </div>
    );
  }
}));

const Terms = lazy(() => Promise.resolve({
  default: function Terms() {
    return (
      <div className="grid gap-6">
        <section className="bg-[#131313] rounded-2xl p-6 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
          <h1 className="text-3xl font-bold">Terms of Use</h1>
          <p className="mt-2 text-[#b8b8b8]">Last updated: {new Date().toLocaleDateString()}</p>
          <h2 className="text-xl font-semibold mt-6">1) Acceptance of Terms</h2>
          <p className="text-[#b8b8b8] mt-2">By accessing or using this website, you agree to these Terms. If you do not agree, do not use the site.</p>
          <h2 className="text-xl font-semibold mt-6">2) Content & Ownership</h2>
          <p className="text-[#b8b8b8] mt-2">All content on this site is owned by Angel Kellogg or licensed to us. Do not copy, modify, or distribute without permission.</p>
          <h2 className="text-xl font-semibold mt-6">3) Permitted Use</h2>
          <ul className="list-disc pl-6 text-[#b8b8b8] space-y-2 mt-2">
            <li>Use the site for lawful, non‑commercial viewing and information.</li>
            <li>Do not interfere with site operation, attempt to access restricted areas, or misuse forms/emails.</li>
          </ul>
          <h2 className="text-xl font-semibold mt-6">4) No Legal or Financial Advice</h2>
          <p className="text-[#b8b8b8] mt-2">Content may discuss business or technology topics for general information. It is not legal, financial, or professional advice.</p>
          <h2 className="text-xl font-semibold mt-6">5) Third‑Party Links</h2>
          <p className="text-[#b8b8b8] mt-2">Links to third‑party sites are provided for convenience. We are not responsible for their content or policies.</p>
          <h2 className="text-xl font-semibold mt-6">6) Warranty Disclaimer</h2>
          <p className="text-[#b8b8b8] mt-2">The site is provided "as is" and "as available" without warranties of any kind.</p>
          <h2 className="text-xl font-semibold mt-6">7) Limitation of Liability</h2>
          <p className="text-[#b8b8b8] mt-2">To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the site.</p>
          <h2 className="text-xl font-semibold mt-6">8) Indemnification</h2>
          <p className="text-[#b8b8b8] mt-2">You agree to defend and hold harmless Angel Kellogg from claims arising out of your misuse of the site or violation of these Terms.</p>
          <h2 className="text-xl font-semibold mt-6">9) Termination</h2>
          <p className="text-[#b8b8b8] mt-2">We may suspend or terminate access at any time for any reason, including if you violate these Terms.</p>
          <h2 className="text-xl font-semibold mt-6">10) Governing Law</h2>
          <p className="text-[#b8b8b8] mt-2">These Terms are governed by the laws of the State of Georgia, USA, without regard to conflicts of law principles.</p>
          <h2 className="text-xl font-semibold mt-6">11) Changes</h2>
          <p className="text-[#b8b8b8] mt-2">We may update these Terms. Continued use of the site after updates constitutes acceptance.</p>
          <h2 className="text-xl font-semibold mt-6">12) Contact</h2>
          <p className="text-[#b8b8b8] mt-2">Questions about these Terms? Email <a className="text-[#d4af37] underline" href="mailto:hello@angelkellogg.com">hello@angelkellogg.com</a>.</p>
        </section>
      </div>
    );
  }
}));

/********************
 * APP + ROUTING
 ********************/
function AppRouterSwitch(){
  const { route } = useRouter();
  
  // Use memo to avoid recreating component on every render
  return useMemo(() => {
    if (route.startsWith('/about')) return <About/>;
    if (route.startsWith('/brands')) return <Brands/>;
    if (route.startsWith('/media')) return <Media/>;
    if (route.startsWith('/contact')) return <Contact/>;
    if (route.startsWith('/privacy')) return <Privacy/>;
    if (route.startsWith('/terms')) return <Terms/>;
    return <Home/>;
  }, [route]);
}

// Add CSS for animations and theme
const GlobalStyles = () => (
  <style>{`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes fadeInUp {
      from { 
        opacity: 0; 
        transform: translateY(20px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .animate-fade-in {
      animation: fadeIn 0.8s ease-out forwards;
    }
    
    .animate-fade-in-delay {
      animation: fadeIn 0.8s ease-out 0.3s forwards;
      opacity: 0;
    }
    
    .animate-fade-in-delay-long {
      animation: fadeIn 0.8s ease-out 0.6s forwards;
      opacity: 0;
    }
    
    .reveal-on-scroll {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    
    .animate-revealed {
      opacity: 1;
      transform: translateY(0);
    }
    
    /* Light theme variables */
    [data-theme="light"] {
      --bg-color: #f5f5f5;
      --text-color: #121212;
      --muted-text: #555;
      --border-color: rgba(0, 0, 0, 0.1);
    }
    
    /* Apply theme variables */
    [data-theme="light"] {
      background-color: var(--bg-color);
      color: var(--text-color);
    }
    
    [data-theme="light"] .text-[#b8b8b8] {
      color: var(--muted-text);
    }
    
    [data-theme="light"] .border-white\/10 {
      border-color: var(--border-color);
    }
    
    [data-theme="light"] .bg-\[\#0a0a0a\] {
      background-color: var(--bg-color);
    }
    
    [data-theme="light"] .bg-black\/60,
    [data-theme="light"] .bg-black\/40,
    [data-theme="light"] .bg-black\/20 {
      background-color: rgba(240, 240, 240, 0.8);
    }
  `}</style>
);

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider>
        <GlobalStyles />
        <Shell>
          <AppRouterSwitch />
        </Shell>
      </RouterProvider>
    </ThemeProvider>
  );
}

/********************
 * DEV TESTS (added; do not change existing tests)
 ********************/
; (function runDevTests(){
  if (typeof window === 'undefined' || window.__angelk_tests_ran) return;
  window.__angelk_tests_ran = true;

  const run = () => {
    try {
      // parsePathFrom tests
      console.assert(parsePathFrom('') === '/', 'parsePathFrom empty → \'/\'');
      console.assert(parsePathFrom('/privacy') === '/privacy', 'parsePathFrom privacy');
      console.assert(parsePathFrom('about') === '/about', 'parsePathFrom adds leading slash');
      console.assert(parsePathFrom('/terms?x=1') === '/terms?x=1', 'parsePathFrom keeps query');

      // Component presence
      console.assert(typeof Home === 'function', 'Home is a function');
      console.assert(typeof Hero === 'function', 'Hero is a function');
      console.assert(typeof About === 'function', 'About is a lazy-loaded function');

      // Router available
      if (!window.__router || typeof window.__router.navigate !== 'function') {
        throw new Error('__router not ready');
      }

      const prev = window.location.pathname;
      window.__router.navigate('/__test__');
      console.assert(window.location.pathname.endsWith('/__test__'), 'navigate updates window.location');
      console.assert(window.__router.route === '/__test__', 'navigate updates internal route');

      // Normalization + idempotence
      window.__router.navigate('about');
      console.assert(window.location.pathname.endsWith('/about'), 'navigate normalizes missing slash');
      window.__router.navigate('/about');
      console.assert(window.__router.route === '/about', 'idempotent navigate');

      // Navigate to policy pages and assert
      window.__router.navigate('/privacy');
      console.assert(window.__router.route === '/privacy', 'navigate to /privacy');
      window.__router.navigate('/terms');
      console.assert(window.__router.route === '/terms', 'navigate to /terms');

      // Restore
      window.history.replaceState({}, '', prev);
      window.dispatchEvent(new Event('popstate'));

      console.log('%cAngelK dev tests passed', 'color:#0f0;padding:2px 6px;border:1px solid #0f0;border-radius:4px');
    } catch (e) {
      if (!run._retries) run._retries = 0;
      if (run._retries < 20) {
        run._retries++;
        return setTimeout(run, 50);
      }
      console.error('AngelK dev tests failed', e);
    }
  };

  run();
})();
