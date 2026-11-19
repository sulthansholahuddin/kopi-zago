import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ASSETS, LANDING_DRINKS } from "@/lib/assets";
import { useAuth, takeGoogleReturn } from "@/lib/auth";
import { ChatBubble } from "@/components/jago/ChatBubble";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jago Coffee — A Cart That Grew With The People" },
      {
        name: "description",
        content: "Cafe-on-wheels coffee from IDR 8K. 100% Arabica, served by Jagoans in your neighborhood. Never a delivery fee.",
      },
      { property: "og:title", content: "Jago Coffee — A Cart That Grew With The People" },
      {
        property: "og:description",
        content: "Cafe-on-wheels coffee from IDR 8K. 100% Arabica, served by Jagoans in your neighborhood.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    title: "Your Neighborhood Cafe",
    text: "Our Jagoans roam the neighborhoods and are always available to serve you a quality beverage.",
    cta: "See Where",
    href: "#about",
    border: "border-jago-blue",
    dot: "bg-jago-blue",
  },
  {
    title: "Quality Doesn't Have To Be Expensive",
    text: "Starting from IDR 8K, you can taste 100% Arabica coffee beans that are traded directly from Indonesian farmers and are roasted with our own recipes.",
    cta: "Sip Yours",
    href: "#menu",
    border: "border-jago-orange",
    dot: "bg-jago-orange",
  },
  {
    title: "Fast And Accessible",
    text: "Order now via Jago App and you'll get a cup-in-hand right away or schedule ahead if that's more convenient. Never a delivery fee.",
    cta: "Try Now",
    href: "/login",
    border: "border-primary",
    dot: "bg-primary",
  },
  {
    title: "Your Jagoans",
    text: "Jagoans are fully trained baristas and the operators of the cart. They're always ready to serve you a fresh cup and provide great hospitality as if you walked into a cafe.",
    cta: "Meet Them",
    href: "#about",
    border: "border-jago-yellow",
    dot: "bg-jago-yellow",
  },
];

const TESTIMONIALS = [
  { text: "The cart design and the concept of cafe-on-wheels are really cool! It's giving a whole new experience for customers", name: "Lonyoh" },
  { text: "A solution for people who want to get a cafe quality coffee with a home-made coffee price. Jago Coffee rocks!", name: "Alpon" },
  { text: "My go-to whenever I crave for a coffee but too lazy to spend a delivery fee. Jago Coffee is indeed the solution", name: "MJ" },
  { text: "You can book Jago Coffee for events too! The baristas are super friendly. Cool !", name: "ripal6" },
];

const STEPS = [
  { title: "1. Choose your location", text: "Our Jagoans will come to you based on your chosen location" },
  { title: "2. Select from coffees or teas", text: "Choose your go-to drinks that start at only IDR 8K" },
  { title: "3. Easily pay and wait for your Jagoan to arrive", text: "Pay with GoPay or OVO and your Jagoan will be there within 15 minutes" },
];

const BLOG = [
  { date: "July 1, 2026", title: "Pink Coco: A Tropical Twist in Every Sip", image: LANDING_DRINKS[0]!.image },
  { date: "July 1, 2026", title: "Meet the Jagoans Behind Every Cart", image: ASSETS.gerobak },
  { date: "April 21, 2026", title: "Collect Energy Points, Sip for Free", image: LANDING_DRINKS[4]!.image },
];

function Landing() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  // Back from Google sign-in: continue to the page the user was heading to (login decides admin/home).
  useEffect(() => {
    if (!session) return;
    const target = takeGoogleReturn();
    if (target === null) return;
    navigate({ to: "/login", search: target ? { redirect: target } : {}, replace: true });
  }, [session, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bg-background">
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 transition-all duration-300 md:px-12",
          scrolled ? "bg-primary py-3 shadow-lg" : "bg-transparent py-6",
        )}
      >
        <a href="#top">
          <img src={ASSETS.logo} alt="Jago Coffee" className="h-10 w-auto" />
        </a>
        <nav className="hidden md:block">
          <ul className="flex gap-7">
            <li><a href="#about" className="jago-nav-link">About Us</a></li>
            <li><a href="#menu" className="jago-nav-link">Menu</a></li>
            <li><a href="#how-it-works" className="jago-nav-link">How It Works</a></li>
            <li><a href="#blog" className="jago-nav-link">Blog</a></li>
          </ul>
        </nav>
        <div className="flex items-center gap-5">
          {session ? (
            <Link to="/home" className="jago-nav-link rounded-full border-2 border-primary-foreground px-5 py-2">
              Pesan Sekarang
            </Link>
          ) : (
            <>
              <Link to="/login" className="jago-nav-link">Login</Link>
              <Link
                to="/login"
                search={{ mode: "register" }}
                className="jago-nav-link rounded-full border-2 border-primary-foreground px-5 py-2"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      <section id="top" className="relative h-screen min-h-[560px] overflow-hidden bg-ink">
        <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover">
          <source src={ASSETS.videoHero} type="video/mp4" />
        </video>
      </section>

      <section id="about" className="px-6 py-20 text-center">
        <h2 className="text-2xl text-ink md:text-4xl">A Cart That Grew With The People</h2>
        <img src={ASSETS.gerobak} alt="Gerobak Jago Coffee" className="mx-auto mt-10 w-full max-w-xl" />
      </section>

      <MenuCarousel />

      <section id="how-it-works" className="bg-ink-soft px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className={cn("relative rounded-2xl border-2 px-8 pb-10 pt-14", f.border)}>
              <div className={cn("absolute -top-8 left-11 h-16 w-16 rounded-full", f.dot)} />
              <h3 className="text-xl text-ink-foreground">{f.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-ink-foreground/75">{f.text}</p>
              {f.href.startsWith("#") ? (
                <a href={f.href} className="jago-label mt-8 inline-block rounded-full bg-primary px-6 py-3 text-xs text-primary-foreground hover:bg-primary-dark">
                  {f.cta}
                </a>
              ) : (
                <Link to="/login" className="jago-label mt-8 inline-block rounded-full bg-primary px-6 py-3 text-xs text-primary-foreground hover:bg-primary-dark">
                  {f.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary px-5 py-16">
        <h2 className="text-center text-2xl text-primary-foreground md:text-3xl">What Our Customers Are Saying</h2>
        <div className="mx-auto mt-10 grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="jago-lift flex flex-col justify-between rounded-xl bg-card p-6">
              <p className="text-sm leading-relaxed text-foreground">{t.text}</p>
              <p className="mt-6 text-xs text-muted-foreground">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink px-6 py-20 text-ink-foreground">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-14 md:flex-row">
          <div className="w-52 shrink-0 overflow-hidden rounded-[2.2rem] border-[6px] border-ink-foreground/90 bg-card">
            <img src={ASSETS.phone} alt="Aplikasi Jago Coffee" className="w-full" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl">Try Jago In 3 Steps</h2>
            <div className="mt-8 space-y-7">
              {STEPS.map((s) => (
                <div key={s.title}>
                  <h3 className="text-base">{s.title}</h3>
                  <p className="mt-1 text-sm text-ink-foreground/80">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="blog" className="bg-cream px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <h2 className="text-3xl text-ink-soft">Newest Blog</h2>
              <p className="mt-3 max-w-lg text-muted-foreground">
                Check out Jago's blog to get served the latest information about what's happening with us.
              </p>
            </div>
            <a href="#blog" className="jago-label self-start rounded-full border-2 border-primary px-5 py-3 text-sm text-primary hover:bg-primary hover:text-primary-foreground">
              See All Post
            </a>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {BLOG.map((b) => (
              <article key={b.title} className="jago-lift overflow-hidden bg-card">
                <div className="flex h-60 items-center justify-center bg-muted">
                  <img src={b.image} alt={b.title} className="h-full w-full object-contain p-6" />
                </div>
                <div className="p-5">
                  <span className="text-sm text-muted-foreground">{b.date}</span>
                  <p className="mt-2 text-lg font-semibold text-ink">{b.title}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />

      <footer className="bg-ink px-6 pb-10 pt-16 text-ink-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr]">
          <div>
            <img src={ASSETS.logo} alt="Jago Coffee" className="h-9 w-auto" />
            <p className="mt-5 text-sm leading-relaxed text-ink-foreground/80">
              Jl. Karet Pasar Baru Barat VII No.8, Karet Tengsin, Kecamatan Tanah Abang, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10250
            </p>
          </div>
          <FooterCol title="Company" items={[["About Us", "#about"], ["Blog", "#blog"], ["Careers", "#about"], ["Privacy", "#about"], ["Terms And Conditions", "#about"]]} />
          <FooterCol title="Product & Services" items={[["Services", "#how-it-works"], ["Jago Party", "/login"]]} />
          <FooterCol title="Support" items={[["Email", "/login"], ["WhatsApp", "/login"]]} />
          <div>
            <div className="rounded-xl border-2 border-primary bg-ink-soft p-5 text-center">
              <span className="jago-label rounded-full bg-primary px-3 py-1 text-[10px]">Promo Spesial</span>
              <h3 className="mt-3 text-2xl">Diskon 20%</h3>
              <p className="mt-2 text-xs text-ink-foreground/75">Khusus pesanan pertamamu hari ini! Yuk daftar & nikmati promonya.</p>
              <Link to="/login" search={{ mode: "register" }} className="jago-label mt-4 inline-block rounded-full bg-primary px-5 py-2 text-[11px] hover:bg-primary-dark">
                Klaim Sekarang
              </Link>
            </div>
            <p className="mt-3 text-center text-sm">*S&K Berlaku</p>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-7xl border-t border-ink-foreground/10 pt-8 text-sm">
          Copyright © 2026 Jago Coffee. All rights reserved.
        </div>
      </footer>

      <ChatBubble />
    </div>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <h4 className="jago-label text-sm">{title}</h4>
      <ul className="mt-5 space-y-3 text-sm">
        {items.map(([label, href]) => (
          <li key={label}>
            {href.startsWith("#") ? (
              <a href={href} className="hover:text-primary">{label}</a>
            ) : (
              <Link to="/login" className="hover:text-primary">{label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MenuCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const CARD = 250;
  const dots = LANDING_DRINKS.length - 3;

  return (
    <section id="menu" className="px-6 py-20">
      <div className="text-center">
        <h2 className="text-2xl text-ink md:text-3xl">Curious About Jago Coffee?</h2>
        <h3 className="mt-4 text-xl text-ink">Get Yours Now!</h3>
      </div>
      <div
        ref={ref}
        onScroll={(e) => setActive(Math.min(dots, Math.round(e.currentTarget.scrollLeft / CARD)))}
        className="scrollbar-none mx-auto mt-12 flex max-w-7xl snap-x gap-0 overflow-x-auto"
      >
        {LANDING_DRINKS.map((d) => (
          <Link key={d.name} to="/home" hash="menu" className="w-[250px] shrink-0 snap-start text-center">
            <div className="flex h-52 items-center justify-center">
              <img src={d.image} alt={d.name} className="h-48 w-48 object-contain transition-transform hover:scale-105" />
            </div>
            <p className="font-display mt-6 text-sm font-black uppercase tracking-wide text-ink">{d.name}</p>
          </Link>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl items-center justify-between">
        <div className="flex gap-2">
          {Array.from({ length: dots + 1 }).map((_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => ref.current?.scrollTo({ left: i * CARD, behavior: "smooth" })}
              className={cn("h-2.5 rounded-full transition-all", i === active ? "w-8 bg-primary" : "w-2.5 bg-border")}
            />
          ))}
        </div>
        <div className="flex gap-4">
          <button aria-label="Sebelumnya" onClick={() => ref.current?.scrollBy({ left: -CARD, behavior: "smooth" })} className="p-2 text-ink hover:text-primary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button aria-label="Berikutnya" onClick={() => ref.current?.scrollBy({ left: CARD, behavior: "smooth" })} className="p-2 text-ink hover:text-primary">
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  return (
    <section className="bg-primary px-6 py-14 text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl">Let's Get Closer To Bang Jago!</h2>
          <p className="mt-3">Receive the newest information & other fun stuff by subscribing our newsletter</p>
        </div>
        <div className="w-full max-w-xl">
          <form
            className="flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Thanks for subscribing!");
              setEmail("");
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Type your email here"
              className="h-14 flex-1 rounded-md bg-card px-5 text-foreground outline-none focus:ring-2 focus:ring-ink"
            />
            <Button type="submit" variant="ink" className="h-14 px-8 text-sm">
              Subscribe
            </Button>
          </form>
          <p className="mt-3 text-xs">By filling this form you'll receive occasional cool news about us.</p>
        </div>
      </div>
    </section>
  );
}
