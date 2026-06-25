import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
      
      <header className="px-8 py-8 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Offhrs.ai Logo" className="w-8 h-8" />
          <span className="font-semibold tracking-tight text-lg">Offhrs.ai</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Link href="/sign-up" className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-md hover:bg-foreground/90 transition-colors">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-8 relative z-10 max-w-5xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter leading-[1.1] mb-6">
            The command center for your evenings.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-light tracking-tight max-w-2xl mb-12 leading-relaxed">
            A brilliant, well-connected assistant that knows your taste, finds the gaps in your calendar, and fills them with things worth showing up for.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Link href="/sign-up" className="group inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-lg text-lg font-medium hover:bg-foreground/90 transition-all">
              Reclaim your time
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/sign-in" className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-lg font-medium border border-border bg-card/50 hover:bg-card hover:border-muted-foreground/30 transition-all text-foreground">
              Sign In
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-border/50 pt-12"
        >
          <div>
            <h3 className="text-accent font-medium mb-2">Automated Discovery</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">We scan the city for events, dinners, and gatherings that match your exact interests.</p>
          </div>
          <div>
            <h3 className="text-accent font-medium mb-2">Calendar Intelligence</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Seamlessly detects gaps in your schedule and drops suggestions right where they fit.</p>
          </div>
          <div>
            <h3 className="text-accent font-medium mb-2">Sunday Reset</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Wake up every Sunday to a curated itinerary for the week ahead. No planning required.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
