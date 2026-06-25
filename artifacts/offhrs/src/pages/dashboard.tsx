import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetMe, getGetMeQueryKey,
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetCalendarGaps, getGetCalendarGapsQueryKey,
  useGetSundayReset, getGetSundayResetQueryKey
} from "@workspace/api-client-react";
import { useClerk } from "@clerk/react";
import { Home, CalendarDays, Search, X, ChevronRight } from "lucide-react";
import TourOverlay, { useShouldShowTour } from "@/components/TourOverlay";

// ── helpers ─────────────────────────────────────────────────────────────────

function getGreeting(name: string | null, gapCount: number, totalHours: number): string {
  const day = new Date().getDay(); // 0=Sun, 1=Mon, …, 6=Sat
  const first = name ? name.split(" ")[0] : null;
  const hi = first ? `${first}.` : "there.";
  if (day === 0) return `Your week is ready, ${hi}`;
  if (day === 6) return `The weekend is yours, ${hi}`;
  const hrs = totalHours > 0 ? `${totalHours}h` : `${gapCount} window${gapCount !== 1 ? "s" : ""}`;
  return `You have ${hrs} of margin today.`;
}

function isSundayOrMonday() {
  const d = new Date().getDay();
  return d === 0 || d === 1;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}


const SURFACED: { id: string; title: string; when: string }[] = [
  { id: "s1", title: "Quiet jazz set", when: "Tonight, 8 PM" },
  { id: "s2", title: "Pop-up ramen workshop", when: "Friday, 7 PM" },
  { id: "s3", title: "Rooftop cinema", when: "Saturday, 9 PM" },
  { id: "s4", title: "Ceramics open studio", when: "Sunday, 2 PM" },
];

// ── sub-components ───────────────────────────────────────────────────────────

function InterestsModal({ interests, onClose }: { interests: string[]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 px-4 pb-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-md bg-[#111] border border-white/8 rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase font-medium">Your Interests</span>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {interests.length === 0 && (
            <span className="text-sm text-muted-foreground font-light">No interests set yet.</span>
          )}
          {interests.map((t) => (
            <span key={t} className="text-xs font-light border border-white/12 px-3 py-1.5 rounded-full text-foreground">
              #{t}
            </span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function MarginTimeline({ gaps }: { gaps: { id: string; startTime: string; endTime: string; durationMinutes: number; label?: string | null }[] }) {
  const START = 17 * 60; // 5 PM in minutes
  const END = 22 * 60;   // 10 PM in minutes
  const TOTAL = END - START;

  const todayDay = new Date().toLocaleDateString("en-US", { weekday: "long" });

  // Filter gaps that fall in our 5–10 PM window
  const todayGaps = gaps.filter((g) => {
    const start = timeToMinutes(g.startTime);
    return start >= START && start < END;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase font-medium">The Margin · {todayDay}</span>
        <span className="text-[10px] tracking-[0.15em] text-muted-foreground/50 uppercase">5 PM – 10 PM</span>
      </div>

      {/* Timeline bar */}
      <div className="relative h-10 bg-[#111] rounded-xl overflow-hidden border border-white/6 mb-3">
        {todayGaps.map((gap) => {
          const gapStart = Math.max(timeToMinutes(gap.startTime), START);
          const gapEnd = Math.min(timeToMinutes(gap.endTime), END);
          const left = ((gapStart - START) / TOTAL) * 100;
          const width = ((gapEnd - gapStart) / TOTAL) * 100;
          return (
            <div
              key={gap.id}
              className="absolute top-0 h-full bg-white/12 border-x border-white/20 flex items-center justify-center"
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              <span className="text-[9px] text-white/60 tracking-wider font-medium whitespace-nowrap">
                {gap.durationMinutes >= 60
                  ? `${Math.floor(gap.durationMinutes / 60)}h${gap.durationMinutes % 60 > 0 ? ` ${gap.durationMinutes % 60}m` : ""}`
                  : `${gap.durationMinutes}m`}
              </span>
            </div>
          );
        })}
        {/* Hour tick marks */}
        {[0, 1, 2, 3, 4].map((h) => (
          <div
            key={h}
            className="absolute top-0 h-full border-l border-white/4"
            style={{ left: `${(h / 5) * 100}%` }}
          />
        ))}
      </div>

      {/* Gap rows with Scout button */}
      <div className="space-y-2">
        {todayGaps.length === 0 && (
          <p className="text-xs text-muted-foreground font-light text-center py-2">No gaps detected today.</p>
        )}
        {todayGaps.map((gap) => (
          <div key={gap.id} className="flex items-center justify-between bg-[#111] border border-white/6 rounded-xl px-4 py-3">
            <div>
              <span className="text-sm font-light">{gap.startTime} – {gap.endTime}</span>
              <span className="block text-[10px] tracking-[0.15em] text-muted-foreground uppercase mt-0.5">
                {gap.label || `${Math.floor(gap.durationMinutes / 60)}h margin`}
              </span>
            </div>
            <button className="text-[10px] tracking-[0.15em] uppercase font-medium border border-white/12 px-3 py-1.5 rounded-full hover:border-white/25 transition-colors text-muted-foreground hover:text-foreground">
              Scout
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── views ────────────────────────────────────────────────────────────────────

function HomeView({
  user, summary, gaps, events, isLoadingGaps, isLoadingEvents, activeInterest, setActiveInterest
}: {
  user: any;
  summary: any;
  gaps: any[];
  events: any[];
  isLoadingGaps: boolean;
  isLoadingEvents: boolean;
  activeInterest: string | null;
  setActiveInterest: (i: string | null) => void;
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const interests: string[] = user?.interests ?? [];

  const greeting = getGreeting(
    user?.name ?? null,
    summary?.gapsThisWeek ?? 0,
    summary?.totalFreeHours ?? 0
  );

  const filteredEvents = activeInterest
    ? events.filter((e) =>
        (e.matchedInterest ?? "").toLowerCase().includes(activeInterest.toLowerCase()) ||
        activeInterest.toLowerCase().includes((e.matchedInterest ?? "").toLowerCase())
      )
    : events;

  const primaryEvents = isSundayOrMonday() ? filteredEvents : filteredEvents.slice(0, 2);
  const isCompact = !isSundayOrMonday();

  const visibleSurfaced = SURFACED.filter((s) => !dismissed.has(s.id));

  return (
    <div className="space-y-8 pb-2">
      {/* Greeting */}
      <motion.div id="tour-header" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase mb-2">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="font-serif text-3xl leading-tight">{greeting}</h1>
      </motion.div>

      {/* Sunday Reset */}
      <motion.section id="tour-sunday-reset" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase font-medium">Sunday Reset</span>
          {isCompact && (
            <button
              onClick={() => setActiveInterest(null)}
              className="text-[10px] tracking-[0.15em] text-muted-foreground/50 uppercase hover:text-muted-foreground transition-colors"
            >
              See all
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-light mb-4">
          {filteredEvents.length} suggested events based on your {interests.length} interests.
        </p>

        {isLoadingEvents ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 bg-[#111] rounded-2xl border border-white/6 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {primaryEvents.map((event, i) => {
              const fitGap = gaps.find(
                (g) => g.dayOfWeek?.toLowerCase() === event.dayOfWeek?.toLowerCase()
              );
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="bg-[#111] border border-white/6 rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-serif text-lg leading-snug flex-1">{event.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground font-light leading-relaxed mb-2">
                    {event.venue} · {event.neighborhood}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {event.travelLabel && (
                      <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.1em] text-muted-foreground/70 bg-white/4 border border-white/8 px-2.5 py-1 rounded-full">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 0C5.24 0 3 2.24 3 5c0 3.75 5 11 5 11s5-7.25 5-11c0-2.76-2.24-5-5-5zm0 6.75A1.75 1.75 0 1 1 8 3.25 1.75 1.75 0 0 1 8 6.75z"/>
                        </svg>
                        {event.travelLabel} from work
                      </span>
                    )}
                    {fitGap && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.12em] text-muted-foreground/60 uppercase border border-white/8 px-2.5 py-1 rounded-full">
                        Fits your {event.dayOfWeek} {fitGap.startTime} gap
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] tracking-[0.15em] text-muted-foreground/50 uppercase">
                      {event.dayOfWeek} · {event.time.split(" ").slice(-2).join(" ")}
                    </span>
                    <button className="text-xs font-medium border border-white/12 px-3 py-1.5 rounded-full hover:bg-white hover:text-black transition-all">
                      Add to calendar
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* The Margin */}
      <motion.section id="tour-margin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {isLoadingGaps ? (
          <div className="h-32 bg-[#111] rounded-2xl border border-white/6 animate-pulse" />
        ) : (
          <MarginTimeline gaps={gaps} />
        )}
      </motion.section>

      {/* Just Surfaced */}
      {visibleSurfaced.length > 0 && (
        <motion.section id="tour-surfaced" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase font-medium block mb-3">
            Just Surfaced
          </span>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-6 px-6 scrollbar-hide">
            {visibleSurfaced.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 bg-[#111] border border-white/6 rounded-2xl p-4 w-44"
              >
                <p className="text-sm font-light leading-snug mb-2">{item.title}</p>
                <p className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase mb-4">{item.when}</p>
                <div className="flex gap-2">
                  <button className="flex-1 text-[10px] tracking-wide font-medium bg-white text-black rounded-full py-1.5 hover:bg-white/90 transition-colors">
                    Add
                  </button>
                  <button
                    onClick={() => setDismissed((d) => new Set([...d, item.id]))}
                    className="flex-1 text-[10px] tracking-wide font-light border border-white/10 rounded-full py-1.5 hover:border-white/20 transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Interest Pulse */}
      {interests.length > 0 && (
        <motion.section id="tour-interests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase font-medium block mb-3">
            Interest Pulse
          </span>
          <div className="flex flex-wrap gap-2">
            {interests.map((tag) => {
              const isActive = activeInterest === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveInterest(isActive ? null : tag)}
                  className={`text-xs font-light px-3 py-1.5 rounded-full border transition-all ${
                    isActive
                      ? "bg-white text-black border-white"
                      : "border-white/12 text-muted-foreground hover:border-white/25 hover:text-foreground"
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
          {activeInterest && (
            <p className="text-xs text-muted-foreground font-light mt-3">
              Showing events matching <span className="text-foreground">#{activeInterest}</span>
              <button onClick={() => setActiveInterest(null)} className="ml-2 underline opacity-50 hover:opacity-100">clear</button>
            </p>
          )}
        </motion.section>
      )}
    </div>
  );
}

function CalendarView({ gaps }: { gaps: any[] }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  return (
    <div>
      <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase mb-6">This Week · The Arc</p>
      <div className="space-y-2">
        {days.map((day) => {
          const dayGaps = gaps.filter((g) => g.dayOfWeek === day);
          return (
            <div key={day} className="bg-[#111] border border-white/6 rounded-xl px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-xs tracking-[0.15em] text-muted-foreground uppercase font-medium">{day}</span>
                {dayGaps.length > 0 ? (
                  <div className="flex gap-2">
                    {dayGaps.map((g) => (
                      <span key={g.id} className="text-xs font-light text-foreground/70">
                        {g.startTime}–{g.endTime}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground/30 font-light">No margin</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExploreView({ interests }: { interests: string[] }) {
  const [query, setQuery] = useState("");
  return (
    <div>
      <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase mb-6">Explore</p>
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events, venues, vibes…"
          className="w-full bg-[#111] border border-white/8 rounded-xl pl-10 pr-4 py-4 text-sm font-light text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-white/20 transition-colors"
        />
      </div>
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground font-light">Search is coming soon.</p>
        <p className="text-xs text-muted-foreground/40 font-light mt-2">For now, Offhours scouts so you don't have to.</p>
      </div>
      {interests.length > 0 && (
        <div>
          <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase font-medium block mb-3">Browse by interest</span>
          <div className="flex flex-wrap gap-2">
            {interests.map((tag) => (
              <button key={tag} className="text-xs font-light px-3 py-1.5 rounded-full border border-white/12 text-muted-foreground hover:border-white/25 hover:text-foreground transition-all flex items-center gap-1">
                #{tag} <ChevronRight className="w-3 h-3 opacity-40" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── main dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { signOut } = useClerk();
  const [tab, setTab] = useState<"home" | "calendar" | "explore">("home");
  const [showInterests, setShowInterests] = useState(false);
  const [activeInterest, setActiveInterest] = useState<string | null>(null);
  const shouldShowTour = useShouldShowTour();
  const [showTour, setShowTour] = useState(false);

  const { data: user, isLoading: isLoadingUser } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: summary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: gaps = [], isLoading: isLoadingGaps } = useGetCalendarGaps({ query: { queryKey: getGetCalendarGapsQueryKey() } });
  const { data: events = [], isLoading: isLoadingEvents } = useGetSundayReset({ query: { queryKey: getGetSundayResetQueryKey() } });

  useEffect(() => {
    if (user && !user.onboardingComplete) setLocation("/onboarding");
  }, [user, setLocation]);

  useEffect(() => {
    if (user?.onboardingComplete && shouldShowTour) {
      const t = setTimeout(() => setShowTour(true), 600);
      return () => clearTimeout(t);
    }
  }, [user, shouldShowTour]);

  if (isLoadingUser || (user && !user.onboardingComplete)) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  const interests: string[] = user?.interests ?? [];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="px-6 pt-10 pb-5 flex items-center justify-between flex-shrink-0">
        <span className="text-base font-semibold tracking-tight">offhours.</span>
        <button
          onClick={() => setShowInterests(true)}
          className="w-8 h-8 rounded-full bg-[#222] border border-white/10 overflow-hidden flex items-center justify-center hover:border-white/20 transition-colors"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-medium text-muted-foreground">
              {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
            </span>
          )}
        </button>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto px-6 pb-28">
        <AnimatePresence mode="wait">
          {tab === "home" && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <HomeView
                user={user}
                summary={summary}
                gaps={gaps}
                events={events}
                isLoadingGaps={isLoadingGaps}
                isLoadingEvents={isLoadingEvents}
                activeInterest={activeInterest}
                setActiveInterest={setActiveInterest}
              />
            </motion.div>
          )}
          {tab === "calendar" && (
            <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <CalendarView gaps={gaps} />
            </motion.div>
          )}
          {tab === "explore" && (
            <motion.div key="explore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <ExploreView interests={interests} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background/95 backdrop-blur border-t border-white/6 flex items-center justify-around px-6 py-4">
        <button
          onClick={() => setTab("home")}
          className={`flex flex-col items-center gap-1 transition-colors ${tab === "home" ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] tracking-[0.15em] uppercase font-medium">Home</span>
        </button>
        <button
          onClick={() => setTab("calendar")}
          className={`flex flex-col items-center gap-1 transition-colors ${tab === "calendar" ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
        >
          <CalendarDays className="w-5 h-5" />
          <span className="text-[9px] tracking-[0.15em] uppercase font-medium">Arc</span>
        </button>
        <button
          onClick={() => setTab("explore")}
          className={`flex flex-col items-center gap-1 transition-colors ${tab === "explore" ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[9px] tracking-[0.15em] uppercase font-medium">Explore</span>
        </button>
      </nav>

      {/* Interests modal */}
      <AnimatePresence>
        {showInterests && (
          <InterestsModal interests={interests} onClose={() => setShowInterests(false)} />
        )}
      </AnimatePresence>

      {/* First-week tour */}
      <AnimatePresence>
        {showTour && (
          <TourOverlay onDone={() => setShowTour(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
