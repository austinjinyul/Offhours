import { Link } from "wouter";
import { motion } from "framer-motion";

export default function LandingPage() {
  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const monthDay = today.toLocaleDateString("en-US", { month: "long", day: "numeric" }).toUpperCase();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col max-w-md mx-auto px-6">
      <header className="pt-12 pb-6 flex items-center justify-between">
        <span className="text-xs tracking-[0.15em] text-muted-foreground font-light">{dayName} · {monthDay}</span>
        <span className="text-sm font-light tracking-widest text-foreground" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.12em" }}>offhours.ai</span>
        <div className="flex gap-4">
          <Link href="/sign-in" className="text-xs tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors uppercase font-light">
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col pt-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-5xl font-semibold leading-[1.08] mb-4 tracking-tight">
            The evenings<br />
            <span className="italic text-muted-foreground font-light">worth taking.</span>
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed mt-5 mb-10 max-w-xs font-light">
            Offhours finds the gaps in your calendar and fills them with events, dinners, and experiences curated to your taste.
          </p>

          <div className="space-y-3">
            <Link href="/sign-up">
              <button className="w-full bg-foreground text-background text-sm font-medium py-4 rounded-full tracking-wide hover:bg-white/90 transition-colors">
                Get started
              </button>
            </Link>
            <Link href="/sign-in">
              <button className="w-full bg-transparent text-foreground text-sm font-light py-4 rounded-full border border-white/10 tracking-wide hover:border-white/20 transition-colors">
                Sign in
              </button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-16 space-y-px"
        >
          {[
            { label: "CALENDAR INTELLIGENCE", desc: "Detects gaps in your schedule and finds events that fit exactly." },
            { label: "CURATED TO YOUR TASTE", desc: "Add your interests once. We scout overnight while you sleep." },
            { label: "SUNDAY RESET", desc: "Every week, a fresh itinerary lands before Monday." },
          ].map((item) => (
            <div key={item.label} className="py-5 border-t border-white/6">
              <div className="text-[10px] tracking-[0.2em] text-muted-foreground mb-2 font-medium">{item.label}</div>
              <div className="text-sm text-foreground/70 font-light leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </motion.div>
      </main>

      <footer className="py-8 text-center">
        <span className="text-[10px] tracking-[0.2em] text-muted-foreground/40 uppercase">Offhours.ai · Your evenings, reclaimed</span>
      </footer>
    </div>
  );
}
