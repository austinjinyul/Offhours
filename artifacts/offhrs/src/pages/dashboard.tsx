import { useLocation } from "wouter";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Sparkles, MapPin } from "lucide-react";
import { 
  useGetMe, getGetMeQueryKey, 
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetCalendarGaps, getGetCalendarGapsQueryKey,
  useGetSundayReset, getGetSundayResetQueryKey
} from "@workspace/api-client-react";
import Header from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isLoadingUser } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  
  useEffect(() => {
    if (user && !user.onboardingComplete) {
      setLocation("/onboarding");
    }
  }, [user, setLocation]);

  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: gaps, isLoading: isLoadingGaps } = useGetCalendarGaps({ query: { queryKey: getGetCalendarGapsQueryKey() } });
  const { data: events, isLoading: isLoadingEvents } = useGetSundayReset({ query: { queryKey: getGetSundayResetQueryKey() } });

  if (isLoadingUser || (user && !user.onboardingComplete)) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col">
        <Header />
        <div className="flex-1 max-w-6xl w-full mx-auto p-8 flex gap-8">
           <Skeleton className="flex-1 bg-border rounded-xl" />
           <Skeleton className="w-[350px] bg-border rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8 relative z-10">
        
        {/* Stats Bar */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Free Hours Detected" 
            value={isLoadingSummary ? <Skeleton className="w-16 h-8 bg-border" /> : summary?.totalFreeHours || 0} 
            subtitle="This week" 
            icon={<Clock className="w-4 h-4 text-accent" />}
          />
          <StatCard 
            title="Calendar Gaps" 
            value={isLoadingSummary ? <Skeleton className="w-16 h-8 bg-border" /> : summary?.gapsThisWeek || 0} 
            subtitle="Evening slots available" 
            icon={<Calendar className="w-4 h-4 text-accent" />}
          />
          <StatCard 
            title="Curated Events" 
            value={isLoadingSummary ? <Skeleton className="w-16 h-8 bg-border" /> : summary?.suggestedEventsCount || 0} 
            subtitle="Based on your interests" 
            icon={<Sparkles className="w-4 h-4 text-accent" />}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sunday Reset Column */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Sunday Reset</h2>
              <p className="text-muted-foreground mt-1">Your curated itinerary for the week ahead.</p>
            </div>

            {isLoadingEvents ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full bg-border rounded-xl" />)}
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={event.id}
                    className="bg-card border border-border p-5 rounded-xl hover:border-accent/40 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-medium text-accent bg-accent/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {event.category}
                        </span>
                        {event.matchedInterest && (
                          <span className="text-xs text-muted-foreground ml-3">
                            Matches: {event.matchedInterest}
                          </span>
                        )}
                      </div>
                      <div className="text-right text-sm font-medium text-foreground bg-background px-3 py-1 rounded-md border border-border">
                        {event.dayOfWeek} • {event.time}
                      </div>
                    </div>
                    <h3 className="text-xl font-medium mb-2 group-hover:text-accent transition-colors">{event.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {event.venue}, {event.neighborhood}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-1">No events this week</h3>
                <p className="text-muted-foreground text-sm">Check back next Sunday for a fresh batch of suggestions.</p>
              </div>
            )}
          </div>

          {/* The Margin Column */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">The Margin</h2>
              <p className="text-muted-foreground mt-1">Found time in your evenings.</p>
            </div>

            {isLoadingGaps ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full bg-border rounded-lg" />)}
              </div>
            ) : gaps && gaps.length > 0 ? (
              <div className="space-y-3">
                {gaps.map((gap, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={gap.id}
                    className="bg-card/50 border border-border p-4 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-sm mb-1">{gap.dayOfWeek}</div>
                      <div className="text-xs text-muted-foreground">{gap.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{gap.startTime} - {gap.endTime}</div>
                      <div className="text-xs text-accent mt-1">{gap.label || `${gap.durationMinutes / 60} hr window`}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-card/50 border border-border border-dashed rounded-lg p-8 text-center">
                <Calendar className="w-6 h-6 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground text-sm">No significant gaps detected this week.</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }: { title: string, value: React.ReactNode, subtitle: string, icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-border p-5 rounded-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon}
      </div>
      <div>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      </div>
    </div>
  );
}
