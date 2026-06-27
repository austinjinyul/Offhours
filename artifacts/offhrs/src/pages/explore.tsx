import { useState } from "react";
import { useClerk } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LogOut } from "lucide-react";

const EVENTS: {
  id: string;
  title: string;
  category: string;
  venue: string;
  neighborhood: string;
  day: string;
  time: string;
  description: string;
}[] = [];

export default function ExplorePage() {
  const { signOut } = useClerk();
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = EVENTS.filter((e) => {
    const q = query.toLowerCase();
    return (
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.neighborhood.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="max-w-lg mx-auto px-5 pt-10 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <span className="text-sm font-light text-foreground" style={{ letterSpacing: "0.12em" }}>
            offhours.ai
          </span>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-[11px] tracking-[0.12em] text-muted-foreground/40 hover:text-muted-foreground transition-colors uppercase"
          >
            <LogOut className="w-3 h-3" />
            Sign out
          </button>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-[2.8rem] font-semibold leading-[1.05] tracking-tight mb-2">
            Explore
          </h1>
          <p className="text-sm text-muted-foreground font-light">
            {filtered.length > 0 ? `${filtered.length} events this week` : "No events yet"}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, venues, neighborhoods…"
            className="w-full bg-[#111] border border-white/8 rounded-xl pl-11 pr-5 py-3.5 text-sm font-light text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-white/18 transition-colors"
          />
        </div>


        {/* Event list */}
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center"
              >
                <p className="text-sm text-muted-foreground/40 font-light mb-1">
                  Events will appear here.
                </p>
                <p className="text-xs text-muted-foreground/25 font-light">
                  Nothing to show yet.
                </p>
              </motion.div>
            )}
            {filtered.map((event, i) => {
              const isExpanded = expandedId === event.id;
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  onClick={() => setExpandedId(isExpanded ? null : event.id)}
                  className="bg-[#111] border border-white/6 rounded-2xl p-5 cursor-pointer hover:border-white/12 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="text-[1.05rem] font-medium leading-snug flex-1">
                      {event.title}
                    </h3>
                    <span className="flex-none text-[10px] tracking-[0.1em] font-medium px-2.5 py-1 rounded-full border border-white/10 text-muted-foreground/60">
                      {event.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/60 font-light mb-3">
                    {event.venue} · {event.neighborhood}
                  </p>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs text-muted-foreground font-light leading-relaxed mb-3 overflow-hidden"
                      >
                        {event.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] tracking-[0.15em] text-muted-foreground/40 uppercase font-medium">
                      {event.day} · {event.time}
                    </span>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-medium border border-white/10 px-3.5 py-1.5 rounded-full hover:bg-white hover:text-black transition-all"
                    >
                      Save
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
