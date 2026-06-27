import { useState } from "react";
import { useClerk } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LogOut } from "lucide-react";

const CATEGORIES = ["All", "Food & Drink", "Fitness", "Networking", "Wellness", "Arts", "Social"];

const EVENTS = [
  {
    id: "e1",
    title: "Natural Wine Tasting",
    category: "Food & Drink",
    venue: "Ordinaire Wine Bar",
    neighborhood: "Grand Lake, Oakland",
    day: "Tuesday",
    time: "7:00 PM",
    description: "Low-intervention wines from small European producers. Guided flight of 6.",
  },
  {
    id: "e2",
    title: "Morning Pilates Flow",
    category: "Fitness",
    venue: "The Pilates Studio",
    neighborhood: "Hayes Valley, SF",
    day: "Wednesday",
    time: "6:30 AM",
    description: "60-minute reformer class focused on core strength and spinal mobility.",
  },
  {
    id: "e3",
    title: "Tech Founders Mixer",
    category: "Networking",
    venue: "Atrium at Pier 17",
    neighborhood: "Embarcadero, SF",
    day: "Thursday",
    time: "6:30 PM",
    description: "Curated gathering of Series A and B founders. 80 attendees, invitation-only.",
  },
  {
    id: "e4",
    title: "Cold Plunge + Sauna Circuit",
    category: "Wellness",
    venue: "Bathhouse SF",
    neighborhood: "SOMA, SF",
    day: "Friday",
    time: "5:30 PM",
    description: "90-minute thermal circuit with guided breathwork intro. Walk-in friendly.",
  },
  {
    id: "e5",
    title: "Bookclub: Fiction & Cognac",
    category: "Social",
    venue: "Lost & Found",
    neighborhood: "Potrero Hill, SF",
    day: "Sunday",
    time: "4:00 PM",
    description: "Monthly literary salon. This month: Kazuo Ishiguro's Klara and the Sun.",
  },
  {
    id: "e6",
    title: "Life Drawing Session",
    category: "Arts",
    venue: "Root Division",
    neighborhood: "Mission, SF",
    day: "Tuesday",
    time: "7:30 PM",
    description: "Open figure drawing studio. All skill levels. Bring your own materials.",
  },
  {
    id: "e7",
    title: "Jazz at the Standard",
    category: "Arts",
    venue: "The Standard",
    neighborhood: "Downtown Oakland",
    day: "Friday",
    time: "9:00 PM",
    description: "Live jazz quartet every Friday night. No cover before 9:30 PM.",
  },
  {
    id: "e8",
    title: "Outdoor Bootcamp",
    category: "Fitness",
    venue: "Dolores Park",
    neighborhood: "Mission, SF",
    day: "Saturday",
    time: "8:00 AM",
    description: "HIIT-style group workout with a certified trainer. Free, all levels welcome.",
  },
  {
    id: "e9",
    title: "Ceramics Drop-In",
    category: "Arts",
    venue: "Choplet Studio",
    neighborhood: "Dogpatch, SF",
    day: "Thursday",
    time: "6:00 PM",
    description: "Open studio session on the wheel or hand-building. No experience needed.",
  },
  {
    id: "e10",
    title: "Sound Bath & Meditation",
    category: "Wellness",
    venue: "Alchemy Collective",
    neighborhood: "Lower Haight, SF",
    day: "Wednesday",
    time: "7:00 PM",
    description: "60-minute sound bath with crystal singing bowls. Mats provided.",
  },
  {
    id: "e11",
    title: "Founders Dinner: Future of AI",
    category: "Networking",
    venue: "Private Residence",
    neighborhood: "Pacific Heights, SF",
    day: "Monday",
    time: "7:00 PM",
    description: "Intimate dinner for 20 operators and founders. Application required.",
  },
  {
    id: "e12",
    title: "Natural Biodynamic Wine Fair",
    category: "Food & Drink",
    venue: "Fort Mason Center",
    neighborhood: "Marina, SF",
    day: "Saturday",
    time: "2:00 PM",
    description: "Over 40 producers pouring. General admission includes 10 tastings.",
  },
];


export default function ExplorePage() {
  const { signOut } = useClerk();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = EVENTS.filter((e) => {
    const matchCat = activeCategory === "All" || e.category === activeCategory;
    const q = query.toLowerCase();
    const matchQ =
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.neighborhood.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="max-w-lg mx-auto px-5 pt-10 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <span
            className="text-sm font-light text-foreground"
            style={{ letterSpacing: "0.12em" }}
          >
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
            {filtered.length} events this week
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

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 mb-7 scrollbar-custom">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-none text-[11px] tracking-[0.12em] font-medium px-4 py-2 rounded-full border transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-foreground text-background border-foreground"
                  : "text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Event list */}
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground/40 font-light py-8 text-center"
              >
                No events match your search.
              </motion.p>
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
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="text-[1.05rem] font-medium leading-snug flex-1">
                      {event.title}
                    </h3>
                    <span className="flex-none text-[10px] tracking-[0.1em] font-medium px-2.5 py-1 rounded-full border border-white/10 text-muted-foreground/60">
                      {event.category}
                    </span>
                  </div>

                  {/* Venue */}
                  <p className="text-xs text-muted-foreground/60 font-light mb-3">
                    {event.venue} · {event.neighborhood}
                  </p>

                  {/* Expanded description */}
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

                  {/* Bottom row */}
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
