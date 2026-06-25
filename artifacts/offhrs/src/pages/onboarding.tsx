import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useGetMe, getGetMeQueryKey, useUpdateInterests } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const SUGGESTIONS = [
  "Natural wine", "Pilates", "Jazz", "Tech mixers", "Cold plunge",
  "Art openings", "Bookclub", "Running clubs", "Fine dining", "Ceramics",
  "Yoga", "Stand-up comedy", "Climbing", "Meditation", "Film screenings",
];

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading: isLoadingUser } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const updateInterests = useUpdateInterests();

  const [interests, setInterests] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (user?.onboardingComplete) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const addInterest = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || interests.includes(trimmed) || interests.length >= 15) return;
    setInterests(prev => [...prev, trimmed]);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addInterest(inputValue);
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(prev => prev.filter(i => i !== interest));
  };

  const handleSave = () => {
    if (interests.length < 5) return;
    updateInterests.mutate(
      { data: { interests } },
      {
        onSuccess: (updatedUser) => {
          queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
          setLocation("/dashboard");
        }
      }
    );
  };

  if (isLoadingUser || user?.onboardingComplete) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  const isValid = interests.length >= 5 && interests.length <= 15;
  const unusedSuggestions = SUGGESTIONS.filter(s => !interests.includes(s));

  return (
    <div className="min-h-[100dvh] bg-background text-foreground max-w-md mx-auto px-6 flex flex-col">
      <header className="pt-10 pb-6 flex items-center justify-between">
        <span className="text-sm font-light tracking-widest text-foreground" style={{ letterSpacing: "0.12em" }}>offhours.ai</span>
        <span className="text-[11px] tracking-[0.15em] text-muted-foreground font-light uppercase">
          {interests.length}/15
        </span>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="flex-1 flex flex-col"
      >
        <h1 className="font-serif text-[2.6rem] leading-[1.1] tracking-tight mb-3">
          What are<br />
          <span className="italic text-muted-foreground">you into?</span>
        </h1>
        <p className="text-sm text-muted-foreground font-light leading-relaxed mb-8">
          Add 5 to 15 interests. We'll use these to scout events overnight and curate your evenings.
        </p>

        <div className="relative mb-6">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type an interest, press Enter…"
            disabled={interests.length >= 15}
            className="w-full bg-card border border-white/8 rounded-xl px-5 py-4 text-sm font-light text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/20 transition-colors disabled:opacity-40"
          />
          {inputValue.trim() && (
            <button
              onClick={() => addInterest(inputValue)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors uppercase font-medium px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
            >
              Add
            </button>
          )}
        </div>

        <div className="mb-6 min-h-[80px]">
          <AnimatePresence>
            {interests.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground/30 font-light"
              >
                Your interests will appear here.
              </motion.p>
            )}
          </AnimatePresence>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {interests.map((interest) => (
                <motion.span
                  key={interest}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  layout
                  className="inline-flex items-center gap-1.5 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-full"
                >
                  {interest}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="hover:opacity-60 transition-opacity rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {unusedSuggestions.length > 0 && interests.length < 15 && (
          <div className="mb-8">
            <div className="text-[10px] tracking-[0.2em] text-muted-foreground font-medium uppercase mb-3">Quick add</div>
            <div className="flex flex-wrap gap-2">
              {unusedSuggestions.slice(0, 8).map((s) => (
                <button
                  key={s}
                  onClick={() => addInterest(s)}
                  className="text-xs font-light text-muted-foreground border border-white/8 px-3 py-1.5 rounded-full hover:border-white/20 hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pb-10">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-light tracking-wide ${interests.length < 5 ? "text-muted-foreground/40" : "text-muted-foreground"}`}>
              {interests.length < 5 ? `Add ${5 - interests.length} more to continue` : "Ready to go"}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={!isValid || updateInterests.isPending}
            className="w-full bg-foreground text-background text-sm font-medium py-4 rounded-full disabled:opacity-30 hover:bg-white/90 transition-all flex items-center justify-center gap-2"
          >
            {updateInterests.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {updateInterests.isPending ? "Saving…" : "Save & continue"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
