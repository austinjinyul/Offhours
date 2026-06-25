import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const TOUR_KEY = "offhours_tour_v1";
const FIRST_LOGIN_KEY = "offhours_first_login";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

interface TourStep {
  id: string;
  label: string;
  title: string;
  body: string;
  position: "top" | "bottom" | "center";
  anchor?: string; // CSS selector to scroll to
}

const STEPS: TourStep[] = [
  {
    id: "welcome",
    label: "",
    title: "Welcome to Offhours.",
    body: "You've got evenings worth protecting. We'll show you how this works — takes about 30 seconds.",
    position: "center",
  },
  {
    id: "greeting",
    label: "THE HEADER",
    title: "Your daily margin at a glance.",
    body: "Each day the greeting updates with how much free time you have tonight. Tap your avatar to review or edit your interests anytime.",
    position: "bottom",
    anchor: "#tour-header",
  },
  {
    id: "sunday-reset",
    label: "SUNDAY RESET",
    title: "Your week, pre-built for you.",
    body: "Every Sunday at 5 PM, we curate 7–10 events that fit your interests and slot into your open calendar windows. Nothing to search for.",
    position: "bottom",
    anchor: "#tour-sunday-reset",
  },
  {
    id: "margin",
    label: "THE MARGIN",
    title: "Your free windows, visualised.",
    body: "The timeline shows tonight's 5–10 PM window. Highlighted bars are your gaps. Tap Scout on any gap for an instant AI suggestion for that exact window.",
    position: "top",
    anchor: "#tour-margin",
  },
  {
    id: "surfaced",
    label: "JUST SURFACED",
    title: "Last-minute finds from this morning.",
    body: "These are events the AI discovered overnight that just opened up. Add them to your week or skip — they refresh each morning.",
    position: "top",
    anchor: "#tour-surfaced",
  },
  {
    id: "interests",
    label: "INTEREST PULSE",
    title: "Filter by what you love.",
    body: "Tap any of your interest tags to instantly filter the Sunday Reset to only show events that match. Tap again to clear.",
    position: "top",
    anchor: "#tour-interests",
  },
  {
    id: "done",
    label: "",
    title: "You're all set.",
    body: "Come back Sunday for your first weekly reset. This tour disappears after your first week — but the app just keeps getting better.",
    position: "center",
  },
];

function getTourState(): { completed: boolean; step: number } {
  try {
    const raw = localStorage.getItem(TOUR_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { completed: false, step: 0 };
}

function saveTourState(state: { completed: boolean; step: number }) {
  localStorage.setItem(TOUR_KEY, JSON.stringify(state));
}

function isWithinFirstWeek(): boolean {
  try {
    const raw = localStorage.getItem(FIRST_LOGIN_KEY);
    if (!raw) {
      localStorage.setItem(FIRST_LOGIN_KEY, String(Date.now()));
      return true;
    }
    return Date.now() - Number(raw) < SEVEN_DAYS;
  } catch {
    return false;
  }
}

export function useShouldShowTour(): boolean {
  const state = getTourState();
  if (state.completed) return false;
  return isWithinFirstWeek();
}

export default function TourOverlay({ onDone }: { onDone: () => void }) {
  const [stepIdx, setStepIdx] = useState(() => getTourState().step);
  const step = STEPS[stepIdx];

  useEffect(() => {
    if (step?.anchor) {
      const el = document.querySelector(step.anchor);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (step?.position === "center") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [stepIdx, step]);

  const advance = () => {
    const next = stepIdx + 1;
    if (next >= STEPS.length) {
      complete();
    } else {
      setStepIdx(next);
      saveTourState({ completed: false, step: next });
    }
  };

  const complete = () => {
    saveTourState({ completed: true, step: STEPS.length - 1 });
    onDone();
  };

  const isLast = stepIdx === STEPS.length - 1;
  const isFirst = stepIdx === 0;

  return (
    <AnimatePresence>
      <motion.div
        key={stepIdx}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(2px)" }}
      >
        {/* Skip button — top right */}
        {!isLast && (
          <button
            onClick={complete}
            className="absolute top-6 right-6 flex items-center gap-1.5 text-[11px] tracking-[0.15em] text-white/30 hover:text-white/60 uppercase font-light transition-colors"
          >
            Skip tour <X className="w-3 h-3" />
          </button>
        )}

        {/* Progress dots */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === stepIdx
                  ? "w-4 h-1.5 bg-white"
                  : i < stepIdx
                  ? "w-1.5 h-1.5 bg-white/40"
                  : "w-1.5 h-1.5 bg-white/15"
              }`}
            />
          ))}
        </div>

        {/* Card — positioned based on step */}
        <div
          className={`absolute left-6 right-6 max-w-md mx-auto ${
            step.position === "top"
              ? "bottom-28"
              : step.position === "bottom"
              ? "top-28"
              : "top-1/2 -translate-y-1/2"
          }`}
          style={{ left: "1.5rem", right: "1.5rem", margin: "0 auto", maxWidth: "28rem" }}
        >
          <motion.div
            key={`card-${stepIdx}`}
            initial={{ opacity: 0, y: step.position === "top" ? 12 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#111] border border-white/10 rounded-2xl p-6"
          >
            {step.label && (
              <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-medium mb-3">
                {step.label}
              </div>
            )}
            <h2 className="font-serif text-2xl leading-snug mb-3 text-white">
              {step.title}
            </h2>
            <p className="text-sm text-white/55 font-light leading-relaxed mb-6">
              {step.body}
            </p>
            <button
              onClick={advance}
              className="w-full bg-white text-black text-sm font-medium py-3.5 rounded-full hover:bg-white/90 transition-colors"
            >
              {isFirst ? "Show me" : isLast ? "Got it" : "Next"}
            </button>
          </motion.div>
        </div>

        {/* Step counter */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.15em] text-white/20 uppercase">
          {stepIdx + 1} of {STEPS.length}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
