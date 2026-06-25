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

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { signOut } = useClerk();
  const { data: user, isLoading: isLoadingUser } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  useEffect(() => {
    if (user && !user.onboardingComplete) {
      setLocation("/onboarding");
    }
  }, [user, setLocation]);

  const { data: summary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: gaps, isLoading: isLoadingGaps } = useGetCalendarGaps({ query: { queryKey: getGetCalendarGapsQueryKey() } });
  const { data: events, isLoading: isLoadingEvents } = useGetSundayReset({ query: { queryKey: getGetSundayResetQueryKey() } });

  const [featuredIdx, setFeaturedIdx] = useState(0);

  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const monthDay = today.toLocaleDateString("en-US", { month: "long", day: "numeric" }).toUpperCase();

  const featuredEvent = events?.[featuredIdx];
  const totalFreeHours = summary?.totalFreeHours ?? 0;
  const totalFreeMin = Math.round((totalFreeHours % 1) * 60);
  const freeHourDisplay = totalFreeHours
    ? `${Math.floor(totalFreeHours)}h ${totalFreeMin > 0 ? totalFreeMin + "m" : ""}`.trim()
    : null;

  if (isLoadingUser || (user && !user.onboardingComplete)) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground max-w-md mx-auto px-6 flex flex-col">
      <header className="pt-10 pb-6 flex items-center justify-between">
        <span className="text-[11px] tracking-[0.15em] text-muted-foreground font-light">{dayName} · {monthDay}</span>
        <span className="text-sm font-light tracking-widest text-foreground" style={{ letterSpacing: "0.12em" }}>offhrs.ai</span>
        <button
          onClick={() => signOut()}
          className="text-[11px] tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors uppercase font-light"
        >
          Out
        </button>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mb-8"
      >
        <h1 className="font-serif text-[2.6rem] leading-[1.1] tracking-tight">
          {gaps && gaps.length > 1 ? `${gaps.length} windows.` : gaps && gaps.length === 1 ? "One window." : "Clear week."}
          <br />
          <span className="italic text-muted-foreground">
            {featuredEvent ? "One worth taking." : "Check back Sunday."}
          </span>
        </h1>
        {freeHourDisplay && (
          <p className="text-sm text-muted-foreground font-light mt-4 leading-relaxed">
            Your calendar has {freeHourDisplay} of unclaimed margin this week.
            {events && events.length > 0 && ` Offhrs scouted ${events.length * 40}+ events overnight and surfaced ones that fit.`}
          </p>
        )}
      </motion.section>

      {featuredEvent && !isLoadingEvents && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="bg-card rounded-2xl p-5 mb-8 border border-white/6"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 inline-block" />
            <span className="text-[10px] tracking-[0.2em] text-muted-foreground font-medium uppercase">
              Morning Scout · {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={featuredIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-serif text-2xl leading-tight mb-3">
                {featuredEvent.title} just surfaced for your {featuredEvent.time} window.
              </h2>
              <p className="text-sm text-muted-foreground font-light leading-relaxed mb-5">
                {featuredEvent.venue} · {featuredEvent.neighborhood}
                {featuredEvent.matchedInterest ? ` · Matches your interest in ${featuredEvent.matchedInterest}` : ""}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3">
            <button className="flex-1 bg-foreground text-background text-sm font-medium py-3.5 rounded-full hover:bg-white/90 transition-colors">
              Add to calendar
            </button>
            <button
              onClick={() => setFeaturedIdx((i) => Math.min(i + 1, (events?.length ?? 1) - 1))}
              className="bg-card border border-white/10 text-foreground text-sm font-light py-3.5 px-5 rounded-full hover:border-white/20 transition-colors"
            >
              Skip
            </button>
          </div>
        </motion.div>
      )}

      {isLoadingEvents && (
        <div className="bg-card rounded-2xl p-5 mb-8 border border-white/6 animate-pulse">
          <div className="h-3 w-32 bg-white/5 rounded mb-4" />
          <div className="h-16 bg-white/5 rounded mb-4" />
          <div className="h-10 bg-white/5 rounded-full" />
        </div>
      )}

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] tracking-[0.2em] text-muted-foreground font-medium uppercase">Today's Windows</span>
          <span className="text-[10px] tracking-[0.2em] text-muted-foreground/50 font-medium uppercase">From Your Calendar</span>
        </div>

        {isLoadingGaps && (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="bg-card rounded-xl h-16 border border-white/6 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoadingGaps && gaps && gaps.length > 0 && (
          <div className="space-y-2">
            {gaps.map((gap, i) => (
              <motion.div
                key={gap.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.07 }}
                className="bg-card border border-white/6 rounded-xl px-5 py-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-light">{gap.startTime} – {gap.endTime}</div>
                  <div className="text-[10px] tracking-[0.15em] text-muted-foreground mt-1 uppercase font-medium">
                    {gap.label || gap.dayOfWeek}
                  </div>
                </div>
                <div className="text-sm font-light text-muted-foreground">
                  {gap.durationMinutes >= 60
                    ? `${Math.floor(gap.durationMinutes / 60)}h${gap.durationMinutes % 60 > 0 ? ` ${gap.durationMinutes % 60}m` : ""}`
                    : `${gap.durationMinutes}m`}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoadingGaps && (!gaps || gaps.length === 0) && (
          <div className="bg-card border border-white/6 rounded-xl px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground font-light">No significant gaps detected this week.</p>
          </div>
        )}
      </motion.section>

      {events && events.length > 1 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mb-10"
        >
          <div className="mb-4">
            <span className="text-[10px] tracking-[0.2em] text-muted-foreground font-medium uppercase">Sunday Reset</span>
          </div>
          <div className="space-y-2">
            {events.slice(1).map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.06 }}
                className="bg-card border border-white/6 rounded-xl px-5 py-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-light leading-snug truncate">{event.title}</div>
                  <div className="text-[10px] tracking-[0.12em] text-muted-foreground mt-1 uppercase font-medium">
                    {event.dayOfWeek} · {event.time}
                  </div>
                </div>
                <div className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase font-medium whitespace-nowrap pt-0.5">
                  {event.category}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      <div className="mt-auto pb-10 text-center">
        <span className="text-[10px] tracking-[0.2em] text-muted-foreground/30 uppercase">Offhrs.ai · Your evenings, reclaimed</span>
      </div>
    </div>
  );
}
